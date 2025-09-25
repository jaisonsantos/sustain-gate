-- Enable Row Level Security on all tables with tenant_id
ALTER TABLE tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE site ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapping_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE datapoint_value ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_grant ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
-- Note: In production, these would be more sophisticated with proper role-based access

-- App User policies (users can only see users in their tenant)
CREATE POLICY app_user_tenant_isolation ON app_user
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Supplier policies
CREATE POLICY supplier_tenant_isolation ON supplier
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Customer policies  
CREATE POLICY customer_tenant_isolation ON customer
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Site policies
CREATE POLICY site_tenant_isolation ON site
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Mapping template policies
CREATE POLICY mapping_template_tenant_isolation ON mapping_template
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Intake policies
CREATE POLICY intake_tenant_isolation ON intake
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Datapoint value policies
CREATE POLICY datapoint_value_tenant_isolation ON datapoint_value
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Data request policies
CREATE POLICY data_request_tenant_isolation ON data_request
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Consent grant policies
CREATE POLICY consent_grant_tenant_isolation ON consent_grant
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Evidence policies
CREATE POLICY evidence_tenant_isolation ON evidence
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Export job policies
CREATE POLICY export_job_tenant_isolation ON export_job
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Share link policies
CREATE POLICY share_link_tenant_isolation ON share_link
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Audit log policies
CREATE POLICY audit_log_tenant_isolation ON audit_log
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create function to set current tenant context
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_uuid uuid)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_uuid::text, true);
END;
$$ LANGUAGE plpgsql;