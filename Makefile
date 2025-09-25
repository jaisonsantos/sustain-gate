# SSDR Makefile
.PHONY: help up down build migrate seed logs clean test

# Default target
help:
	@echo "SSDR - Supplier Sustainability Data Router"
	@echo ""
	@echo "Available commands:"
	@echo "  up      - Start all services"
	@echo "  down    - Stop all services"
	@echo "  build   - Build all Docker images"
	@echo "  migrate - Run database migrations"
	@echo "  seed    - Seed database with demo data"
	@echo "  logs    - Show logs from all services"
	@echo "  clean   - Clean up Docker resources"
	@echo "  test    - Run tests"

# Start all services
up:
	docker compose -f infra/docker-compose.yml up -d --build

# Stop all services
down:
	docker compose -f infra/docker-compose.yml down

# Build Docker images
build:
	docker compose -f infra/docker-compose.yml build

# Run database migrations
migrate:
	@echo "Running database migrations..."
	docker compose -f infra/docker-compose.yml exec api alembic upgrade head

# Seed database with demo data
seed:
	@echo "Seeding database with demo data..."
	docker compose -f infra/docker-compose.yml exec api python -c "
	from app.db import SessionLocal, init_db
	from app.models import *
	import uuid
	from datetime import datetime
	
	# Initialize database
	init_db()
	
	db = SessionLocal()
	
	# Create demo tenant
	tenant = Tenant(
		id=uuid.UUID('550e8400-e29b-41d4-a716-446655440001'),
		name='Demo Tenant',
		plan='enterprise',
		is_controller=True
	)
	db.add(tenant)
	
	# Create demo user
	user = AppUser(
		id=uuid.UUID('550e8400-e29b-41d4-a716-446655440000'),
		tenant_id=tenant.id,
		email='admin@demo.local',
		role='admin',
		password_hash='fake_hash'
	)
	db.add(user)
	
	# Create demo supplier
	supplier = Supplier(
		id=uuid.UUID('550e8400-e29b-41d4-a716-446655440002'),
		tenant_id=tenant.id,
		legal_name='Demo Supplier Ltd',
		country='ES',
		tax_id='ESB12345678'
	)
	db.add(supplier)
	
	# Create demo customer
	customer = Customer(
		id=uuid.UUID('550e8400-e29b-41d4-a716-446655440003'),
		tenant_id=tenant.id,
		name='Green Corp GmbH',
		country='DE',
		external_portals=['ecovadis', 'cdp']
	)
	db.add(customer)
	
	# Create demo purpose
	purpose = Purpose(
		id=uuid.UUID('550e8400-e29b-41d4-a716-446655440004'),
		code='DEMO_ASSESSMENT',
		description='Demo sustainability assessment',
		legal_basis='contract'
	)
	db.add(purpose)
	
	# Seed canonical datapoints
	datapoints = [
		DatapointDef(key='energy.electricity_kwh', type='numeric', unit='kWh', description='Total electricity consumption'),
		DatapointDef(key='energy.fuels_liters', type='numeric', unit='L', description='Total fuel consumption'),
		DatapointDef(key='purchases.total_eur', type='numeric', unit='EUR', description='Total purchases value'),
		DatapointDef(key='freight.ton_km_road', type='numeric', unit='ton·km', description='Road freight transport'),
		DatapointDef(key='freight.ton_km_sea', type='numeric', unit='ton·km', description='Sea freight transport'),
		DatapointDef(key='freight.ton_km_air', type='numeric', unit='ton·km', description='Air freight transport'),
		DatapointDef(key='water.m3_total', type='numeric', unit='m³', description='Total water consumption'),
		DatapointDef(key='waste.total_kg', type='numeric', unit='kg', description='Total waste generated'),
		DatapointDef(key='packaging.kg_total', type='numeric', unit='kg', description='Total packaging materials'),
		DatapointDef(key='materials.recycled_content_pct', type='numeric', unit='%', description='Recycled content percentage'),
		DatapointDef(key='energy.renewable_pct', type='numeric', unit='%', description='Renewable energy percentage'),
		DatapointDef(key='site.count', type='integer', unit='count', description='Number of sites'),
		DatapointDef(key='employees.count', type='integer', unit='count', description='Employee count'),
		DatapointDef(key='policy.has_esg_policy', type='boolean', unit='boolean', description='Has ESG policy'),
		DatapointDef(key='certifications.list', type='array', unit='list', description='List of certifications')
	]
	
	for dp in datapoints:
		db.add(dp)
	
	db.commit()
	db.close()
	
	print('Database seeded successfully!')
	"

# Show logs
logs:
	docker compose -f infra/docker-compose.yml logs -f

# Clean up Docker resources
clean:
	docker compose -f infra/docker-compose.yml down -v
	docker system prune -f

# Run tests
test:
	@echo "Running API tests..."
	docker compose -f infra/docker-compose.yml exec api pytest

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:8000/healthz && echo "✅ API is healthy" || echo "❌ API is not responding"
	@curl -f http://localhost:9000/minio/health/live && echo "✅ MinIO is healthy" || echo "❌ MinIO is not responding"

# Development helpers
dev-logs:
	docker compose -f infra/docker-compose.yml logs -f api worker

dev-shell:
	docker compose -f infra/docker-compose.yml exec api bash

dev-db:
	docker compose -f infra/docker-compose.yml exec db psql -U app -d ssdr