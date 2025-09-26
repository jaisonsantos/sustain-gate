import { apiClient } from "./api";

export interface Plan {
  id: string;
  name: string;
  price: string;
  price_id: string;
  features: string[];
  limits: {
    active_requests: number;
    exports_per_day: number;
    storage_gb: number;
  };
}

export interface BillingStatus {
  plan: string;
  billing_status: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  trial_until?: string;
  usage: {
    active_requests: number;
    exports_this_month: number;
    storage_gb: number;
  };
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface PortalResponse {
  portal_url: string;
}

class BillingApiClient {
  
  async getPlans(): Promise<{plans: Plan[]}> {
    const response = await fetch(`${apiClient['baseUrl']}/billing/plans`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ssdr_token')}` }
    });
    return response.json();
  }
  
  async getBillingStatus(): Promise<BillingStatus> {
    const response = await fetch(`${apiClient['baseUrl']}/billing/status`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ssdr_token')}` }
    });
    return response.json();
  }
  
  async createCheckoutSession(priceId: string, mode: "subscription" | "payment" = "subscription"): Promise<CheckoutResponse> {
    const response = await fetch(`${apiClient['baseUrl']}/billing/checkout`, {
      method: "POST",
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('ssdr_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_id: priceId,
        mode,
        success_url: `${window.location.origin}/settings?billing=success`,
        cancel_url: `${window.location.origin}/settings?billing=cancel`
      })
    });
    return response.json();
  }
  
  async createPortalSession(): Promise<PortalResponse> {
    const response = await fetch(`${apiClient['baseUrl']}/billing/portal`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ssdr_token')}` }
    });
    return response.json();
  }
}

export const billingApi = new BillingApiClient();