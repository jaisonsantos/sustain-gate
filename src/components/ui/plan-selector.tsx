import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Star, Crown } from "lucide-react";
import type { Plan } from "@/lib/billingApi";

interface PlanSelectorProps {
  plans: Plan[];
  currentPlan?: string;
  onSelectPlan: (priceId: string) => void;
  loading?: boolean;
}

export function PlanSelector({ plans, currentPlan, onSelectPlan, loading }: PlanSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'poc':
        return <Zap className="w-5 h-5" />;
      case 'pro_t1':
        return <Star className="w-5 h-5" />;
      case 'pro_t2':
        return <Star className="w-5 h-5" />;
      case 'pro_t3':
        return <Crown className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };
  
  const getPlanVariant = (planId: string) => {
    if (planId === currentPlan) return "default";
    if (planId === 'pro_t3') return "secondary";
    return "outline";
  };
  
  const formatLimit = (value: number) => {
    return value === -1 ? "Unlimited" : value.toString();
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative transition-all hover:shadow-md ${
            currentPlan === plan.id ? 'ring-2 ring-primary' : ''
          } ${
            selectedPlan === plan.id ? 'ring-2 ring-primary/50' : ''
          }`}
        >
          {currentPlan === plan.id && (
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              Current Plan
            </Badge>
          )}
          
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-2">
              {getPlanIcon(plan.id)}
            </div>
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">
              {plan.price}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Features */}
            <div className="space-y-2">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            {/* Limits */}
            <div className="pt-2 border-t space-y-1">
              <div className="text-xs text-muted-foreground">Limits:</div>
              <div className="text-xs space-y-1">
                <div>• {formatLimit(plan.limits.active_requests)} active requests</div>
                <div>• {formatLimit(plan.limits.exports_per_day)} exports/day</div>
                <div>• {formatLimit(plan.limits.storage_gb)} GB storage</div>
              </div>
            </div>
            
            {/* Action Button */}
            <Button
              variant={getPlanVariant(plan.id)}
              className="w-full"
              onClick={() => {
                setSelectedPlan(plan.id);
                onSelectPlan(plan.price_id);
              }}
              disabled={loading || currentPlan === plan.id}
            >
              {loading && selectedPlan === plan.id ? (
                "Processing..."
              ) : currentPlan === plan.id ? (
                "Current Plan"
              ) : (
                "Select Plan"
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}