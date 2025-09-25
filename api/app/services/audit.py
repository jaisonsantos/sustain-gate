"""
Audit service for SSDR
Maintains append-only audit log with hash chain verification
"""
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import hashlib
import json
import uuid
from datetime import datetime

from ..models import AuditLog

async def log_audit_event(
    db: Session,
    tenant_id: uuid.UUID,
    actor: uuid.UUID,
    entity: str,
    entity_id: str,
    action: str,
    details: Dict[str, Any] = None
) -> AuditLog:
    """
    Log an audit event with hash chain verification
    """
    if details is None:
        details = {}
    
    # Get the last audit log entry for this tenant to get prev_hash
    last_entry = db.query(AuditLog).filter(
        AuditLog.tenant_id == tenant_id
    ).order_by(AuditLog.id.desc()).first()
    
    prev_hash = last_entry.this_hash if last_entry else "genesis"
    
    # Create audit log entry
    audit_entry = AuditLog(
        tenant_id=tenant_id,
        actor=actor,
        entity=entity,
        entity_id=entity_id,
        action=action,
        details=details,
        prev_hash=prev_hash
    )
    
    # Calculate this_hash
    audit_entry.this_hash = calculate_audit_hash(audit_entry)
    
    # Save to database
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    
    return audit_entry

def calculate_audit_hash(audit_entry: AuditLog) -> str:
    """
    Calculate SHA256 hash for audit entry
    Hash = SHA256(prev_hash || payload_compact)
    """
    # Create compact payload for hashing
    payload = {
        "tenant_id": str(audit_entry.tenant_id),
        "actor": str(audit_entry.actor),
        "entity": audit_entry.entity,
        "entity_id": audit_entry.entity_id,
        "action": audit_entry.action,
        "details": audit_entry.details,
        "ts": audit_entry.ts.isoformat() if audit_entry.ts else datetime.utcnow().isoformat()
    }
    
    # Create hash input
    hash_input = audit_entry.prev_hash + json.dumps(payload, sort_keys=True, separators=(',', ':'))
    
    # Calculate SHA256
    return "sha256:" + hashlib.sha256(hash_input.encode('utf-8')).hexdigest()

def verify_audit_chain(db: Session, tenant_id: uuid.UUID) -> Dict[str, Any]:
    """
    Verify the integrity of the audit chain for a tenant
    Returns verification result with any inconsistencies found
    """
    # Get all audit entries for tenant ordered by ID
    entries = db.query(AuditLog).filter(
        AuditLog.tenant_id == tenant_id
    ).order_by(AuditLog.id).all()
    
    if not entries:
        return {
            "valid": True,
            "total_entries": 0,
            "inconsistencies": []
        }
    
    inconsistencies = []
    prev_hash = "genesis"
    
    for entry in entries:
        # Verify prev_hash matches
        if entry.prev_hash != prev_hash:
            inconsistencies.append({
                "entry_id": entry.id,
                "issue": "prev_hash_mismatch",
                "expected": prev_hash,
                "actual": entry.prev_hash
            })
        
        # Recalculate and verify this_hash
        expected_hash = calculate_audit_hash(entry)
        if entry.this_hash != expected_hash:
            inconsistencies.append({
                "entry_id": entry.id,
                "issue": "hash_mismatch",
                "expected": expected_hash,
                "actual": entry.this_hash
            })
        
        prev_hash = entry.this_hash
    
    return {
        "valid": len(inconsistencies) == 0,
        "total_entries": len(entries),
        "inconsistencies": inconsistencies,
        "chain_tip_hash": prev_hash
    }

def get_audit_trail(
    db: Session,
    tenant_id: uuid.UUID,
    entity: Optional[str] = None,
    entity_id: Optional[str] = None,
    limit: int = 100
) -> Dict[str, Any]:
    """
    Get audit trail for entity or tenant
    """
    query = db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id)
    
    if entity:
        query = query.filter(AuditLog.entity == entity)
    
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    
    entries = query.order_by(AuditLog.ts.desc()).limit(limit).all()
    
    return {
        "entries": [
            {
                "id": entry.id,
                "ts": entry.ts.isoformat(),
                "actor": str(entry.actor),
                "entity": entry.entity,
                "entity_id": entry.entity_id,
                "action": entry.action,
                "details": entry.details,
                "this_hash": entry.this_hash
            }
            for entry in entries
        ],
        "count": len(entries)
    }