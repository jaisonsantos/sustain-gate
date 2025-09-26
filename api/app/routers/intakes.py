from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Dict, List
import uuid
import os
import json
from datetime import datetime

from ..config import settings
from ..db import get_db
from ..deps import get_current_user
from ..models import AppUser, Intake
from ..services.audit import log_audit_event

router = APIRouter()
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/upload")
async def upload_intake(
    file: UploadFile = File(...),
    supplier_id: str = Form(...),
    period_start: str = Form(...),
    period_end: str = Form(...),
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user)
) -> Dict:
    """
    Upload intake file (CSV/XLSX)
    """
    # Generate unique intake ID
    intake_id = uuid.uuid4()
    
    # Validate file type
    if not file.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    
    # Save file to intake directory
    file_path = os.path.join(settings.INTAKES_DIR, f"{intake_id}_{file.filename}")
    
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 10MB limit")

    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create intake record
    intake = Intake(
        id=intake_id,
        tenant_id=current_user.tenant_id,
        supplier_id=uuid.UUID(supplier_id),
        source=file.filename,
        period_start=datetime.strptime(period_start, "%Y-%m-%d").date(),
        period_end=datetime.strptime(period_end, "%Y-%m-%d").date(),
        status="uploaded",
        created_by=current_user.id
    )
    
    db.add(intake)
    db.commit()
    db.refresh(intake)
    
    # Log audit event
    await log_audit_event(
        db=db,
        tenant_id=current_user.tenant_id,
        actor=current_user.id,
        entity="intake",
        entity_id=str(intake.id),
        action="uploaded",
        details={"filename": file.filename, "size": len(content)}
    )
    
    return {
        "intake_id": str(intake.id),
        "status": "uploaded",
        "filename": file.filename
    }

@router.post("/{intake_id}/validate")
async def validate_intake(
    intake_id: str,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user)
) -> Dict:
    """
    Validate intake data
    Stub implementation for MVP
    """
    # Get intake
    intake = db.query(Intake).filter(
        Intake.id == uuid.UUID(intake_id),
        Intake.tenant_id == current_user.tenant_id
    ).first()
    
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")
    
    # Stub validation - in real implementation would run validation engine
    errors = []
    warnings = [
        {"field": "energy.electricity_kwh", "message": "Value seems unusually high"}
    ]
    
    # Update status if no blocking errors
    if not errors:
        intake.status = "validated"
    else:
        intake.status = "rejected"
    
    db.commit()
    
    # Log audit event
    await log_audit_event(
        db=db,
        tenant_id=current_user.tenant_id,
        actor=current_user.id,
        entity="intake",
        entity_id=str(intake.id),
        action="validated",
        details={"errors": len(errors), "warnings": len(warnings)}
    )
    
    return {
        "errors": errors,
        "warnings": warnings,
        "status": intake.status
    }

@router.post("/{intake_id}/publish")
async def publish_intake(
    intake_id: str,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user)
) -> Dict:
    """
    Publish validated intake
    """
    # Get intake
    intake = db.query(Intake).filter(
        Intake.id == uuid.UUID(intake_id),
        Intake.tenant_id == current_user.tenant_id
    ).first()
    
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")
    
    if intake.status != "validated":
        raise HTTPException(status_code=400, detail="Intake must be validated before publishing")
    
    # Update status
    intake.status = "published"
    db.commit()
    
    # Log audit event
    await log_audit_event(
        db=db,
        tenant_id=current_user.tenant_id,
        actor=current_user.id,
        entity="intake",
        entity_id=str(intake.id),
        action="published",
        details={}
    )
    
    return {
        "status": "published",
        "intake_id": str(intake.id)
    }