from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import Tenant, DataRequest, ExportJob, Evidence
from fastapi import HTTPException
import datetime

class FeatureGate:
    """Feature gate service for plan-based access control"""
    
    PLAN_LIMITS = {
        "free": {
            "active_requests": 1,
            "exports_per_day": 5,
            "storage_gb": 1
        },
        "poc": {
            "active_requests": 2,
            "exports_per_day": 10,
            "storage_gb": 5
        },
        "pro_t1": {
            "active_requests": 5,
            "exports_per_day": 25,
            "storage_gb": 10
        },
        "pro_t2": {
            "active_requests": 10,
            "exports_per_day": 50,
            "storage_gb": 25
        },
        "pro_t3": {
            "active_requests": -1,  # unlimited
            "exports_per_day": 100,
            "storage_gb": 100
        },
        "onprem": {
            "active_requests": -1,  # unlimited
            "exports_per_day": -1,  # unlimited
            "storage_gb": -1  # unlimited
        }
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_tenant_limits(self, tenant: Tenant) -> Dict[str, Any]:
        """Get limits for a tenant based on their plan"""
        return self.PLAN_LIMITS.get(tenant.plan, self.PLAN_LIMITS["free"])
    
    def get_tenant_usage(self, tenant: Tenant) -> Dict[str, Any]:
        """Calculate current usage for tenant"""
        
        # Active requests (status not in closed/delivered)
        active_requests = self.db.query(DataRequest).filter(
            DataRequest.tenant_id == tenant.id,
            DataRequest.status.in_(["new", "awaiting_data", "in_review", "ready"])
        ).count()
        
        # Exports today
        today = datetime.date.today()
        exports_today = self.db.query(ExportJob).filter(
            ExportJob.tenant_id == tenant.id,
            ExportJob.created_at >= today
        ).count()
        
        # Storage (stub - would need to calculate from evidence files)
        storage_gb = 2.3  # TODO: calculate actual storage
        
        return {
            "active_requests": active_requests,
            "exports_today": exports_today,
            "storage_gb": storage_gb
        }
    
    def can_create_request(self, tenant: Tenant) -> bool:
        """Check if tenant can create a new request"""
        limits = self.get_tenant_limits(tenant)
        usage = self.get_tenant_usage(tenant)
        
        max_requests = limits["active_requests"]
        if max_requests == -1:  # unlimited
            return True
        
        return usage["active_requests"] < max_requests
    
    def can_create_export(self, tenant: Tenant) -> bool:
        """Check if tenant can create a new export"""
        limits = self.get_tenant_limits(tenant)
        usage = self.get_tenant_usage(tenant)
        
        max_exports = limits["exports_per_day"]
        if max_exports == -1:  # unlimited
            return True
        
        return usage["exports_today"] < max_exports
    
    def can_upload_evidence(self, tenant: Tenant, file_size_gb: float) -> bool:
        """Check if tenant can upload evidence file"""
        limits = self.get_tenant_limits(tenant)
        usage = self.get_tenant_usage(tenant)
        
        max_storage = limits["storage_gb"]
        if max_storage == -1:  # unlimited
            return True
        
        return (usage["storage_gb"] + file_size_gb) <= max_storage
    
    def enforce_request_limit(self, tenant: Tenant):
        """Enforce request creation limit"""
        if not self.can_create_request(tenant):
            limits = self.get_tenant_limits(tenant)
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "Request limit exceeded",
                    "current_plan": tenant.plan,
                    "limit": limits["active_requests"],
                    "upgrade_required": True
                }
            )
    
    def enforce_export_limit(self, tenant: Tenant):
        """Enforce export creation limit"""
        if not self.can_create_export(tenant):
            limits = self.get_tenant_limits(tenant)
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "Daily export limit exceeded",
                    "current_plan": tenant.plan,
                    "limit": limits["exports_per_day"],
                    "upgrade_required": True
                }
            )
    
    def enforce_storage_limit(self, tenant: Tenant, file_size_gb: float):
        """Enforce storage limit"""
        if not self.can_upload_evidence(tenant, file_size_gb):
            limits = self.get_tenant_limits(tenant)
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "Storage limit exceeded",
                    "current_plan": tenant.plan,
                    "limit_gb": limits["storage_gb"],
                    "upgrade_required": True
                }
            )

def get_feature_gate(db: Session) -> FeatureGate:
    """Get feature gate instance"""
    return FeatureGate(db)