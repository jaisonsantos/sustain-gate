from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, Date, Numeric, ARRAY, JSON, ForeignKey, BigInteger, CHAR
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB, CITEXT
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

# Tenancy & Users
class Tenant(Base):
    __tablename__ = "tenant"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    plan = Column(Text, nullable=False)
    is_controller = Column(Boolean, default=True)
    stripe_customer_id = Column(Text)
    stripe_subscription_id = Column(Text)
    billing_status = Column(Text, default="active")  # active, past_due, canceled
    trial_until = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AppUser(Base):
    __tablename__ = "app_user"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id"))
    email = Column(CITEXT, unique=True)
    role = Column(Text)  # owner, admin, analyst, viewer
    password_hash = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Supplier & Customer
class Supplier(Base):
    __tablename__ = "supplier"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id"))
    legal_name = Column(Text)
    country = Column(CHAR(2))
    tax_id = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Customer(Base):
    __tablename__ = "customer"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id"))
    name = Column(Text)
    country = Column(CHAR(2))
    external_portals = Column(ARRAY(Text))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Sites
class Site(Base):
    __tablename__ = "site"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id"))
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("supplier.id"))
    name = Column(Text)
    country = Column(CHAR(2))
    nace_code = Column(Text)
    grid_region = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Dictionary
class DatapointDef(Base):
    __tablename__ = "datapoint_def"
    
    key = Column(Text, primary_key=True)
    type = Column(Text)
    unit = Column(Text)
    description = Column(Text)

# Templates & Mapping
class MappingTemplate(Base):
    __tablename__ = "mapping_template"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id"))
    name = Column(Text)
    target_portal = Column(Text)
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MappingRule(Base):
    __tablename__ = "mapping_rule"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("mapping_template.id"))
    version = Column(Integer, default=1)
    source_path = Column(Text)
    target_key = Column(Text, ForeignKey("datapoint_def.key"))
    transform_dsl = Column(JSONB)
    required = Column(Boolean, default=False)

# Intakes & Data
class Intake(Base):
    __tablename__ = "intake"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True))
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("supplier.id"))
    source = Column(Text)
    period_start = Column(Date)
    period_end = Column(Date)
    status = Column(Text)  # uploaded, parsed, validated, rejected, published
    used_mapping_template = Column(UUID(as_uuid=True))
    used_mapping_version = Column(Integer)
    used_export_version = Column(Integer)
    created_by = Column(UUID(as_uuid=True), ForeignKey("app_user.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DatapointValue(Base):
    __tablename__ = "datapoint_value"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True))
    supplier_id = Column(UUID(as_uuid=True))
    intake_id = Column(UUID(as_uuid=True), ForeignKey("intake.id"))
    site_id = Column(UUID(as_uuid=True), ForeignKey("site.id"))
    key = Column(Text, ForeignKey("datapoint_def.key"))
    value_json = Column(JSONB)
    period_start = Column(Date)
    period_end = Column(Date)
    source_type = Column(Text, default="upload")  # upload, api, manual, rpa
    evidence_ids = Column(ARRAY(UUID(as_uuid=True)), default=[])
    confidence = Column(Numeric(3,2), default=1.00)
    verified = Column(Boolean, default=False)
    verified_by = Column(UUID(as_uuid=True))
    verified_at = Column(DateTime(timezone=True))
    lineage_json = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Requests & Consent
class Purpose(Base):
    __tablename__ = "purpose"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(Text, unique=True)
    description = Column(Text)
    legal_basis = Column(Text)

class DataRequest(Base):
    __tablename__ = "data_request"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True))
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customer.id"))
    title = Column(Text)
    due_date = Column(Date)
    status = Column(Text)  # new, awaiting_data, in_review, ready, delivered, closed
    required_keys = Column(ARRAY(Text))
    purpose_id = Column(UUID(as_uuid=True), ForeignKey("purpose.id"))
    retention_until = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ConsentGrant(Base):
    __tablename__ = "consent_grant"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True))
    supplier_id = Column(UUID(as_uuid=True))
    customer_id = Column(UUID(as_uuid=True))
    scope_keys = Column(ARRAY(Text))
    purpose_id = Column(UUID(as_uuid=True), ForeignKey("purpose.id"))
    valid_from = Column(DateTime(timezone=True))
    valid_until = Column(DateTime(timezone=True))
    legal_hold = Column(Boolean, default=False)
    revoked = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Evidence
class Evidence(Base):
    __tablename__ = "evidence"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True))
    supplier_id = Column(UUID(as_uuid=True))
    intake_id = Column(UUID(as_uuid=True))
    filename = Column(Text)
    s3_path = Column(Text)
    sha256 = Column(Text)
    meta = Column(JSONB)
    retention_until = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Exports
class ExportTemplate(Base):
    __tablename__ = "export_template"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text)
    version = Column(Integer, default=1)
    engine = Column(Text, default="jinja2")  # jinja2, custom
    format = Column(Text)  # pdf, csv, json
    template_body = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ExportJob(Base):
    __tablename__ = "export_job"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True))
    supplier_id = Column(UUID(as_uuid=True))
    request_id = Column(UUID(as_uuid=True), ForeignKey("data_request.id"))
    template_id = Column(UUID(as_uuid=True), ForeignKey("export_template.id"))
    status = Column(Text)  # queued, running, done, failed
    output_zip_path = Column(Text)
    output_hash = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True))

class ShareLink(Base):
    __tablename__ = "share_link"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True))
    export_id = Column(UUID(as_uuid=True), ForeignKey("export_job.id"))
    token = Column(Text, unique=True)
    expires_at = Column(DateTime(timezone=True))
    allowed_ips = Column(ARRAY(INET))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Buyer API
class BuyerAPIKey(Base):
    __tablename__ = "buyer_api_key"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customer.id"))
    name = Column(Text)
    token_hash = Column(Text)
    scope = Column(JSONB)
    ip_allowlist = Column(ARRAY(INET))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked = Column(Boolean, default=False)

# Audit
class AuditLog(Base):
    __tablename__ = "audit_log"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tenant_id = Column(UUID(as_uuid=True))
    actor = Column(UUID(as_uuid=True))
    entity = Column(Text)
    entity_id = Column(Text)
    action = Column(Text)
    details = Column(JSONB)
    prev_hash = Column(Text)
    this_hash = Column(Text)
    ts = Column(DateTime(timezone=True), server_default=func.now())

# Usage Tracking
class UsageCounter(Base):
    __tablename__ = "usage_counter"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id"))
    metric = Column(Text)  # active_requests, exports, storage_gb
    period_start = Column(Date)
    period_end = Column(Date)
    value = Column(Numeric)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Billing Events
class BillingEvent(Base):
    __tablename__ = "billing_event"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stripe_event_id = Column(Text, unique=True)
    event_type = Column(Text)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())