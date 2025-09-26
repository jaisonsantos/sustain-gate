from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import stripe
import hmac
import hashlib
import json

from ..config import settings
from ..db import get_db
from ..models import Tenant, BillingEvent
from ..deps import get_current_user

# Configure Stripe
stripe.api_key = settings.STRIPE_API_KEY

router = APIRouter(prefix="/billing", tags=["billing"])

class CheckoutRequest(BaseModel):
    price_id: str
    mode: str = "subscription"  # subscription, payment
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None

class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str

class PortalResponse(BaseModel):
    portal_url: str

@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CheckoutRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe Checkout session for subscription or one-time payment"""
    
    # Get tenant
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Create or get Stripe customer
    if tenant.stripe_customer_id:
        customer_id = tenant.stripe_customer_id
    else:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=tenant.name,
            metadata={"tenant_id": str(tenant.id)}
        )
        tenant.stripe_customer_id = customer.id
        db.commit()
        customer_id = customer.id
    
    # Default URLs
    success_url = request.success_url or "http://localhost:5173/settings?billing=success"
    cancel_url = request.cancel_url or "http://localhost:5173/settings?billing=cancel"
    
    # Create checkout session
    session_params = {
        "customer": customer_id,
        "success_url": success_url,
        "cancel_url": cancel_url,
        "metadata": {"tenant_id": str(tenant.id)},
    }
    
    if request.mode == "subscription":
        session_params.update({
            "mode": "subscription",
            "line_items": [{
                "price": request.price_id,
                "quantity": 1,
            }],
        })
    else:
        session_params.update({
            "mode": "payment",
            "line_items": [{
                "price": request.price_id,
                "quantity": 1,
            }],
        })
    
    if settings.STRIPE_TAX_ENABLED:
        session_params["automatic_tax"] = {"enabled": True}
    
    session = stripe.checkout.Session.create(**session_params)
    
    return CheckoutResponse(
        checkout_url=session.url,
        session_id=session.id
    )

@router.get("/portal", response_model=PortalResponse)
async def create_portal_session(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe Customer Portal session"""
    
    # Get tenant
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant or not tenant.stripe_customer_id:
        raise HTTPException(status_code=404, detail="No billing account found")
    
    session = stripe.billing_portal.Session.create(
        customer=tenant.stripe_customer_id,
        return_url="http://localhost:5173/settings"
    )
    
    return PortalResponse(portal_url=session.url)

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks"""
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Check idempotency
    existing_event = db.query(BillingEvent).filter(
        BillingEvent.stripe_event_id == event['id']
    ).first()
    
    if existing_event:
        return {"ok": True, "message": "Event already processed"}
    
    # Process the event
    try:
        await handle_billing_event(db, event)
        
        # Mark as processed
        billing_event = BillingEvent(
            stripe_event_id=event['id'],
            event_type=event['type']
        )
        db.add(billing_event)
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing webhook: {str(e)}")
    
    return {"ok": True}

async def handle_billing_event(db: Session, event):
    """Handle specific billing events"""
    
    event_type = event['type']
    
    if event_type == 'checkout.session.completed':
        session = event['data']['object']
        tenant_id = session['metadata'].get('tenant_id')
        
        if tenant_id:
            tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if tenant:
                tenant.stripe_customer_id = session['customer']
                if session['mode'] == 'subscription':
                    tenant.stripe_subscription_id = session['subscription']
                    tenant.billing_status = 'active'
                db.commit()
    
    elif event_type == 'customer.subscription.created':
        subscription = event['data']['object']
        customer_id = subscription['customer']
        
        tenant = db.query(Tenant).filter(
            Tenant.stripe_customer_id == customer_id
        ).first()
        
        if tenant:
            tenant.stripe_subscription_id = subscription['id']
            tenant.billing_status = 'active'
            
            # Update plan based on price
            price_id = subscription['items']['data'][0]['price']['id']
            tenant.plan = map_price_to_plan(price_id)
            db.commit()
    
    elif event_type == 'customer.subscription.updated':
        subscription = event['data']['object']
        
        tenant = db.query(Tenant).filter(
            Tenant.stripe_subscription_id == subscription['id']
        ).first()
        
        if tenant:
            tenant.billing_status = subscription['status']
            
            # Update plan based on price
            price_id = subscription['items']['data'][0]['price']['id']
            tenant.plan = map_price_to_plan(price_id)
            db.commit()
    
    elif event_type == 'customer.subscription.deleted':
        subscription = event['data']['object']
        
        tenant = db.query(Tenant).filter(
            Tenant.stripe_subscription_id == subscription['id']
        ).first()
        
        if tenant:
            tenant.billing_status = 'canceled'
            tenant.plan = 'free'  # Downgrade to free
            db.commit()
    
    elif event_type == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        subscription_id = invoice['subscription']
        
        if subscription_id:
            tenant = db.query(Tenant).filter(
                Tenant.stripe_subscription_id == subscription_id
            ).first()
            
            if tenant:
                tenant.billing_status = 'active'
                db.commit()
    
    elif event_type == 'invoice.payment_failed':
        invoice = event['data']['object']
        subscription_id = invoice['subscription']
        
        if subscription_id:
            tenant = db.query(Tenant).filter(
                Tenant.stripe_subscription_id == subscription_id
            ).first()
            
            if tenant:
                tenant.billing_status = 'past_due'
                db.commit()

def map_price_to_plan(price_id: str) -> str:
    """Map Stripe price ID to internal plan name"""
    mapping = {
        settings.STRIPE_PRICE_POC: 'poc',
        settings.STRIPE_PRICE_PRO_T1: 'pro_t1',
        settings.STRIPE_PRICE_PRO_T2: 'pro_t2',
        settings.STRIPE_PRICE_PRO_T3: 'pro_t3',
    }
    return mapping.get(price_id, 'free')

@router.get("/plans")
async def get_plans():
    """Get available billing plans"""
    return {
        "plans": [
            {
                "id": "poc",
                "name": "POC",
                "price": "€900/month",
                "price_id": settings.STRIPE_PRICE_POC,
                "features": [
                    "Up to 2 active requests",
                    "Basic templates",
                    "Email support"
                ],
                "limits": {
                    "active_requests": 2,
                    "exports_per_day": 10,
                    "storage_gb": 5
                }
            },
            {
                "id": "pro_t1",
                "name": "Professional Tier 1",
                "price": "€600/month",
                "price_id": settings.STRIPE_PRICE_PRO_T1,
                "features": [
                    "Up to 5 active requests",
                    "All templates",
                    "Priority support"
                ],
                "limits": {
                    "active_requests": 5,
                    "exports_per_day": 25,
                    "storage_gb": 10
                }
            },
            {
                "id": "pro_t2",
                "name": "Professional Tier 2",
                "price": "€900/month",
                "price_id": settings.STRIPE_PRICE_PRO_T2,
                "features": [
                    "Up to 10 active requests",
                    "All templates + custom",
                    "Priority support"
                ],
                "limits": {
                    "active_requests": 10,
                    "exports_per_day": 50,
                    "storage_gb": 25
                }
            },
            {
                "id": "pro_t3",
                "name": "Professional Tier 3",
                "price": "€1,500/month",
                "price_id": settings.STRIPE_PRICE_PRO_T3,
                "features": [
                    "Unlimited active requests",
                    "All templates + custom",
                    "Dedicated support"
                ],
                "limits": {
                    "active_requests": -1,  # unlimited
                    "exports_per_day": 100,
                    "storage_gb": 100
                }
            }
        ]
    }

@router.get("/status")
async def get_billing_status(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current billing status for tenant"""
    
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Get usage info (stub for now)
    usage = {
        "active_requests": 1,  # TODO: calculate from data_request table
        "exports_this_month": 5,  # TODO: calculate from export_job table
        "storage_gb": 2.3  # TODO: calculate from evidence table
    }
    
    return {
        "plan": tenant.plan,
        "billing_status": tenant.billing_status,
        "stripe_customer_id": tenant.stripe_customer_id,
        "stripe_subscription_id": tenant.stripe_subscription_id,
        "trial_until": tenant.trial_until,
        "usage": usage
    }