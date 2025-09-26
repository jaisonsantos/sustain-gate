import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BillingStatusCard } from "@/components/ui/billing-status";
import { PlanSelector } from "@/components/ui/plan-selector";
import { billingApi, type BillingStatus, type Plan } from "@/lib/billingApi";
import { toast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon,
  Shield,
  Bell,
  Key,
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CreditCard
} from "lucide-react";

export default function Settings() {
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  
  useEffect(() => {
    loadBillingData();
  }, []);
  
  const loadBillingData = async () => {
    try {
      const [statusResponse, plansResponse] = await Promise.all([
        billingApi.getBillingStatus(),
        billingApi.getPlans()
      ]);
      setBillingStatus(statusResponse);
      setPlans(plansResponse.plans);
    } catch (error) {
      console.error("Failed to load billing data:", error);
      // Don't show error toast - billing might not be set up yet
    }
  };
  
  const handleUpgrade = () => {
    setShowPlans(true);
  };
  
  const handleSelectPlan = async (priceId: string) => {
    setLoading(true);
    try {
      const response = await billingApi.createCheckoutSession(priceId);
      window.location.href = response.checkout_url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const response = await billingApi.createPortalSession();
      window.location.href = response.portal_url;
    } catch (error) {
      console.error("Failed to create portal session:", error);
      toast({
        title: "Error", 
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings, security, and platform configuration
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Billing & Plans */}
          {billingStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Billing & Subscription
                </CardTitle>
                <CardDescription>
                  Manage your subscription plan and billing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {showPlans ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Choose Your Plan</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowPlans(false)}
                      >
                        Back to Status
                      </Button>
                    </div>
                    <PlanSelector
                      plans={plans}
                      currentPlan={billingStatus.plan}
                      onSelectPlan={handleSelectPlan}
                      loading={loading}
                    />
                  </div>
                ) : (
                  <BillingStatusCard
                    billingStatus={billingStatus}
                    onUpgrade={handleUpgrade}
                    onManageBilling={handleManageBilling}
                  />
                )}
              </CardContent>
            </Card>
          )}
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" defaultValue="ACME Sustainability Ltd" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input id="tax-id" defaultValue="DE123456789" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" defaultValue="Germany" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" defaultValue="Manufacturing" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" defaultValue="Sustainability Street 123, 10115 Berlin, Germany" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Configure data retention, validation rules, and export settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Data Validation</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically validate uploaded data against ESRS standards
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Evidence Files</Label>
                    <p className="text-sm text-muted-foreground">
                      Require supporting evidence for all sustainability claims
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-generate Export Signatures</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sign exports with digital certificates
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention">Data Retention Period (months)</Label>
                <Input id="retention" type="number" defaultValue="36" min="12" max="120" />
                <p className="text-sm text-muted-foreground">
                  How long to retain data and evidence files (12-120 months)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Manage security settings and privacy controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>API Access Logs</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all API access for audit purposes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Encrypt Data at Rest</Label>
                    <p className="text-sm text-muted-foreground">
                      Encrypt sensitive data in the database
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 mt-0.5 text-primary" />
                  <div className="space-y-2">
                    <h4 className="font-medium">API Keys</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage API keys for customer access and integrations
                    </p>
                    <Button variant="outline" size="sm">
                      Manage API Keys
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure email and webhook notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Data Requests</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when customers create new data requests
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Export Completion</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when exports are ready for download
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Validation Errors</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about validation errors in uploaded data
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
                <Input 
                  id="webhook-url" 
                  placeholder="https://your-domain.com/webhooks/ssdr" 
                />
                <p className="text-sm text-muted-foreground">
                  Receive real-time notifications via webhooks
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Billing */}
          {billingStatus && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Plan</span>
                    <Badge>{billingStatus.plan.toUpperCase()}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Status</span>
                    <Badge variant={billingStatus.billing_status === 'active' ? 'outline' : 'destructive'}>
                      {billingStatus.billing_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Usage</span>
                    <span>{billingStatus.usage.active_requests} requests</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleUpgrade}
                >
                  {billingStatus.plan === 'free' ? 'Subscribe Now' : 'Upgrade Plan'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Settings
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Upload className="w-4 h-4 mr-2" />
                Import Configuration
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                Download Data
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="destructive" size="sm" className="w-full justify-start">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}