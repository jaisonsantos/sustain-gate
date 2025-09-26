-- Demo seed data for SSDR MVP
INSERT INTO tenant (id, name, plan, is_controller)
VALUES ('11111111-2222-3333-4444-555555555555', 'Demo Tenant GmbH', 'pilot', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_user (id, tenant_id, email, role)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '11111111-2222-3333-4444-555555555555',
  'admin@demo.local',
  'owner'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO supplier (id, tenant_id, legal_name, country, tax_id)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  '11111111-2222-3333-4444-555555555555',
  'DEMO Supplier Ltd',
  'DE',
  'DEMO-ESG-001'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO customer (id, tenant_id, name, country)
VALUES (
  'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
  '11111111-2222-3333-4444-555555555555',
  'Demo Customer GmbH',
  'DE'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO purpose (id, code, description, legal_basis)
VALUES (
  'cccccccc-dddd-eeee-ffff-000000000000',
  'DEMO_ASSESSMENT',
  'Demo sustainability assessment sharing',
  'contract'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO data_request (id, tenant_id, customer_id, title, due_date, status, required_keys, purpose_id)
VALUES (
  'dddddddd-eeee-ffff-0000-111111111111',
  '11111111-2222-3333-4444-555555555555',
  'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
  'EcoVadis FY2025 Demo',
  CURRENT_DATE + INTERVAL '30 days',
  'awaiting_data',
  ARRAY['energy.electricity_kwh','water.m3_total'],
  'cccccccc-dddd-eeee-ffff-000000000000'
)
ON CONFLICT (id) DO NOTHING;
