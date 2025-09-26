import type { BillingStatus } from "./billingApi";

export type Plan = "free" | "poc" | "pro_t1" | "pro_t2" | "pro_t3" | "onprem";

export interface FeatureGateContext {
  plan: Plan;
  billing_status: string;
  usage: {
    active_requests: number;
    exports_this_month: number;
    storage_gb: number;
  };
}

const PLAN_LIMITS = {
  free: {
    active_requests: 1,
    exports_per_day: 5,
    storage_gb: 1
  },
  poc: {
    active_requests: 2,
    exports_per_day: 10,
    storage_gb: 5
  },
  pro_t1: {
    active_requests: 5,
    exports_per_day: 25,
    storage_gb: 10
  },
  pro_t2: {
    active_requests: 10,
    exports_per_day: 50,
    storage_gb: 25
  },
  pro_t3: {
    active_requests: -1, // unlimited
    exports_per_day: 100,
    storage_gb: 100
  },
  onprem: {
    active_requests: -1, // unlimited
    exports_per_day: -1, // unlimited
    storage_gb: -1 // unlimited
  }
};

export class FeatureGates {
  constructor(private context: FeatureGateContext) {}
  
  getLimits() {
    return PLAN_LIMITS[this.context.plan] || PLAN_LIMITS.free;
  }
  
  canCreateRequest(): boolean {
    const limits = this.getLimits();
    if (limits.active_requests === -1) return true;
    return this.context.usage.active_requests < limits.active_requests;
  }
  
  canCreateExport(): boolean {
    const limits = this.getLimits();
    if (limits.exports_per_day === -1) return true;
    return this.context.usage.exports_this_month < limits.exports_per_day;
  }
  
  canUploadEvidence(fileSizeGb: number): boolean {
    const limits = this.getLimits();
    if (limits.storage_gb === -1) return true;
    return (this.context.usage.storage_gb + fileSizeGb) <= limits.storage_gb;
  }
  
  getUsagePercentage(metric: keyof typeof PLAN_LIMITS.free): number {
    const limits = this.getLimits();
    const limit = limits[metric];
    if (limit === -1) return 0; // unlimited
    
    const usage = this.context.usage[metric === 'exports_per_day' ? 'exports_this_month' : metric];
    return Math.min((usage / limit) * 100, 100);
  }
  
  requiresUpgrade(feature: string): boolean {
    switch (feature) {
      case 'request_creation':
        return !this.canCreateRequest();
      case 'export_creation':
        return !this.canCreateExport();
      default:
        return false;
    }
  }
}

export function createFeatureGates(billingStatus: BillingStatus): FeatureGates {
  return new FeatureGates({
    plan: billingStatus.plan as Plan,
    billing_status: billingStatus.billing_status,
    usage: billingStatus.usage
  });
}

export const PLAN_DISPLAY_NAMES: Record<Plan, string> = {
  free: "Free",
  poc: "POC",
  pro_t1: "Professional Tier 1",
  pro_t2: "Professional Tier 2", 
  pro_t3: "Professional Tier 3",
  onprem: "On-Premise"
};