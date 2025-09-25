"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2025-09-25 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Create initial schema"""
    
    # Enable extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
    op.execute("CREATE EXTENSION IF NOT EXISTS citext;")
    
    # Create tables
    op.create_table('tenant',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('plan', sa.Text(), nullable=False),
        sa.Column('is_controller', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('app_user',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('email', postgresql.CITEXT(), nullable=True),
        sa.Column('role', sa.Text(), nullable=True),
        sa.Column('password_hash', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    
    op.create_table('supplier',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('legal_name', sa.Text(), nullable=True),
        sa.Column('country', sa.CHAR(length=2), nullable=True),
        sa.Column('tax_id', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('customer',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.Text(), nullable=True),
        sa.Column('country', sa.CHAR(length=2), nullable=True),
        sa.Column('external_portals', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('datapoint_def',
        sa.Column('key', sa.Text(), nullable=False),
        sa.Column('type', sa.Text(), nullable=True),
        sa.Column('unit', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('key')
    )
    
    op.create_table('purpose',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('legal_basis', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    
    op.create_table('export_template',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.Text(), nullable=True),
        sa.Column('version', sa.Integer(), nullable=True),
        sa.Column('engine', sa.Text(), nullable=True),
        sa.Column('format', sa.Text(), nullable=True),
        sa.Column('template_body', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Continue with remaining tables...
    op.create_table('site',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('supplier_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.Text(), nullable=True),
        sa.Column('country', sa.CHAR(length=2), nullable=True),
        sa.Column('nace_code', sa.Text(), nullable=True),
        sa.Column('grid_region', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['supplier_id'], ['supplier.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('mapping_template',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.Text(), nullable=True),
        sa.Column('target_portal', sa.Text(), nullable=True),
        sa.Column('version', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('intake',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('supplier_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('source', sa.Text(), nullable=True),
        sa.Column('period_start', sa.Date(), nullable=True),
        sa.Column('period_end', sa.Date(), nullable=True),
        sa.Column('status', sa.Text(), nullable=True),
        sa.Column('used_mapping_template', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('used_mapping_version', sa.Integer(), nullable=True),
        sa.Column('used_export_version', sa.Integer(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['app_user.id'], ),
        sa.ForeignKeyConstraint(['supplier_id'], ['supplier.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('data_request',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.Text(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('status', sa.Text(), nullable=True),
        sa.Column('required_keys', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('purpose_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('retention_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customer.id'], ),
        sa.ForeignKeyConstraint(['purpose_id'], ['purpose.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('consent_grant',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('supplier_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('scope_keys', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('purpose_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('valid_from', sa.DateTime(timezone=True), nullable=True),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('legal_hold', sa.Boolean(), nullable=True),
        sa.Column('revoked', sa.Boolean(), nullable=True),
        sa.Column('version', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['purpose_id'], ['purpose.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('evidence',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('supplier_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('intake_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('filename', sa.Text(), nullable=True),
        sa.Column('s3_path', sa.Text(), nullable=True),
        sa.Column('sha256', sa.Text(), nullable=True),
        sa.Column('meta', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('retention_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('buyer_api_key',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.Text(), nullable=True),
        sa.Column('token_hash', sa.Text(), nullable=True),
        sa.Column('scope', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_allowlist', postgresql.ARRAY(postgresql.INET()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('revoked', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customer.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('audit_log',
        sa.Column('id', sa.BigInteger(), nullable=False, autoincrement=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('actor', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('entity', sa.Text(), nullable=True),
        sa.Column('entity_id', sa.Text(), nullable=True),
        sa.Column('action', sa.Text(), nullable=True),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('prev_hash', sa.Text(), nullable=True),
        sa.Column('this_hash', sa.Text(), nullable=True),
        sa.Column('ts', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create remaining tables and apply RLS
    op.execute(open(f'{op.get_context().script.dir}/../app/rls.sql').read())

def downgrade() -> None:
    """Drop all tables"""
    op.drop_table('audit_log')
    op.drop_table('buyer_api_key')
    op.drop_table('evidence')
    op.drop_table('consent_grant')
    op.drop_table('data_request')
    op.drop_table('intake')
    op.drop_table('mapping_template')
    op.drop_table('site')
    op.drop_table('export_template')
    op.drop_table('purpose')
    op.drop_table('datapoint_def')
    op.drop_table('customer')
    op.drop_table('supplier')
    op.drop_table('app_user')
    op.drop_table('tenant')