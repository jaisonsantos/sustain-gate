from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict
import uuid
import os
import json
import zipfile
from datetime import datetime

from ..config import settings
from ..db import get_db
from ..deps import get_current_user
from ..models import AppUser, ExportJob
from ..services.audit import log_audit_event

router = APIRouter()

class ExportRequest(BaseModel):
    supplier_id: str
    request_id: str
    period_start: str
    period_end: str

@router.post("/{template}")
async def create_export(
    template: str,
    request: ExportRequest,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user)
) -> Dict:
    """
    Create export with specified template
    Generates stub ZIP with manifest.json and audit.json
    """
    # Generate unique export ID
    export_id = uuid.uuid4()
    
    # Create export job record
    export_job = ExportJob(
        id=export_id,
        tenant_id=current_user.tenant_id,
        supplier_id=uuid.UUID(request.supplier_id),
        request_id=uuid.UUID(request.request_id),
        status="queued"
    )
    
    db.add(export_job)
    db.commit()
    
    # Generate stub ZIP file
    zip_path = os.path.join(settings.EXPORTS_DIR, f"{export_id}.zip")
    
    try:
        with zipfile.ZipFile(zip_path, 'w') as zip_file:
            # Create manifest.json
            manifest = {
                "$schema": "https://ssdr.dev/schemas/manifest-v1.json",
                "export_id": str(export_id),
                "supplier": {
                    "id": request.supplier_id,
                    "legal_name": "DEMO Supplier Ltd"
                },
                "customer": {
                    "id": "demo-customer",
                    "name": "Demo Customer GmbH"
                },
                "period": {
                    "start": request.period_start,
                    "end": request.period_end
                },
                "template": {
                    "name": template,
                    "version": 1
                },
                "consent": {
                    "scope_keys": ["energy.electricity_kwh", "water.m3_total"],
                    "purpose_code": "DEMO_ASSESSMENT",
                    "valid_until": "2026-01-31T00:00:00Z"
                },
                "hashes": {
                    "data": "sha256:demo_hash_data",
                    "evidences": ["sha256:demo_hash_evidence"]
                },
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "audit": {
                    "log_chain_hash": "sha256:demo_audit_chain"
                }
            }
            
            zip_file.writestr("manifest.json", json.dumps(manifest, indent=2))
            
            # Create audit.json
            audit_log = {
                "events": [
                    {
                        "ts": datetime.utcnow().isoformat() + "Z",
                        "actor": f"user:{current_user.id}",
                        "entity": "export",
                        "id": str(export_id),
                        "action": "generated",
                        "this_hash": "sha256:demo_event_hash"
                    }
                ]
            }
            
            zip_file.writestr("audit.json", json.dumps(audit_log, indent=2))
            
            # Create sample data file based on template
            if template == "ecovadis_basic":
                sample_data = """EcoVadis Assessment Report
                
Supplier: DEMO Supplier Ltd
Period: {} to {}
Generated: {}

Energy Consumption:
- Electricity: 12,000 kWh
- Renewable %: 28%

Water & Waste:
- Water consumption: 800 m³
- Waste generated: 1,200 kg

Transport:
- Road freight: 5,000 ton·km
- Sea freight: 600 ton·km
""".format(request.period_start, request.period_end, datetime.utcnow().strftime("%Y-%m-%d"))
                
                zip_file.writestr("ecovadis_report.txt", sample_data)
            
            elif template == "cdp_basic":
                zip_file.writestr("cdp_data.csv", "datapoint,value,unit\nenergy.electricity_kwh,12000,kWh\nwater.m3_total,800,m3")
        
        # Update export job status
        export_job.status = "done"
        export_job.output_zip_path = zip_path
        export_job.finished_at = datetime.utcnow()
        db.commit()
        
        # Log audit event
        await log_audit_event(
            db=db,
            tenant_id=current_user.tenant_id,
            actor=current_user.id,
            entity="export",
            entity_id=str(export_id),
            action="generated",
            details={"template": template, "zip_path": zip_path}
        )
        
        return {
            "export_id": str(export_id),
            "status": "done",
            "template": template,
            "zip_path": zip_path
        }
        
    except Exception as e:
        export_job.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to generate export: {str(e)}")