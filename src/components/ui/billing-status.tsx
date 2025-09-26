import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CreditCard, AlertTriangle, CheckCircle } from "lucide-react";
import type { BillingStatus } from "@/lib/billingApi";
import { createFeatureGates, PLAN_DISPLAY_NAMES } from "@/lib/featureGates";

interface BillingStatusCardProps {
  billingStatus: BillingStatus;
  onUpgrade?: () => void;
  onManageBilling?: () => void;
}

export function BillingStatusCard({ billingStatus, onUpgrade, onManageBilling }: BillingStatusCardProps) {
  const featureGates = createFeatureGates(billingStatus);
  const limits = featureGates.getLimits();
  
  const getStatusBadge = () => {
    switch (billingStatus.billing_status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'past_due':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Past Due</Badge>;
      case 'canceled':
        return <Badge variant="secondary">Canceled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const formatLimit = (value: number) => {
    return value === -1 ? "Unlimited" : value.toString();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Billing & Usage
        </CardTitle>
        <CardDescription>
          Manage your subscription and monitor usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan & Status */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Plan</span>
            <Badge variant="outline">
              {PLAN_DISPLAY_NAMES[billingStatus.plan as keyof typeof PLAN_DISPLAY_NAMES] || billingStatus.plan}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Status</span>
            {getStatusBadge()}
          </div>
        </div>
        
        {/* Usage Metrics */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Usage This Period</h4>
          
          {/* Active Requests */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Active Requests</span>
              <span>{billingStatus.usage.active_requests} / {formatLimit(limits.active_requests)}</span>
            </div>
            {limits.active_requests !== -1 && (
              <Progress 
                value={featureGates.getUsagePercentage('active_requests')} 
                className="h-2"
              />
            )}
          </div>
          
          {/* Exports */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Exports This Month</span>
              <span>{billingStatus.usage.exports_this_month} / {formatLimit(limits.exports_per_day)}</span>
            </div>
            {limits.exports_per_day !== -1 && (
              <Progress 
                value={featureGates.getUsagePercentage('exports_per_day')} 
                className="h-2"
              />
            )}
          </div>
          
          {/* Storage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Used</span>
              <span>{billingStatus.usage.storage_gb.toFixed(1)} GB / {formatLimit(limits.storage_gb)} GB</span>
            </div>
            {limits.storage_gb !== -1 && (
              <Progress 
                value={featureGates.getUsagePercentage('storage_gb')} 
                className="h-2"
              />
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          {billingStatus.stripe_customer_id && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onManageBilling}
              className="flex-1"
            >
              Manage Billing
            </Button>
          )}
          <Button 
            variant="default" 
            size="sm" 
            onClick={onUpgrade}
            className="flex-1"
          >
            {billingStatus.plan === 'free' ? 'Subscribe' : 'Upgrade Plan'}
          </Button>
        </div>
        
        {/* Warnings */}
        {billingStatus.billing_status === 'past_due' && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Payment past due. Please update your payment method.
            </div>
          </div>
        )}
        
        {featureGates.requiresUpgrade('request_creation') && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <AlertTriangle className="w-4 h-4" />
              Request limit reached. Upgrade to create more requests.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}