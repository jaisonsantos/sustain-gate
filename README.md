# Sustain Gate

Sustain Gate is a full-stack MVP for routing supplier sustainability data through an upload → validate → publish → export workflow.

The project combines a FastAPI backend, React frontend, PostgreSQL, Redis, and object storage to model a practical ESG supplier-data pipeline with tenant-aware workflows and export generation.

## Why this project

Supplier sustainability workflows often begin as spreadsheets and manual evidence collection. Sustain Gate explores how that process can be turned into a structured system with explicit validation states, canonical datapoints, publishing controls, and reproducible exports.

## Engineering highlights

- **FastAPI backend** for authentication, supplier-data intake, validation, publishing, and exports.
- **React/Vite frontend** with protected routes and API-driven workflow states.
- **PostgreSQL persistence** with Alembic migrations and seeded demo data.
- **Redis + MinIO** in the local infrastructure stack.
- **JWT-based authentication** with automatic 401 handling in the frontend API client.
- **Upload pipeline** with explicit `uploading → parsing → validating` states.
- **Canonical sustainability datapoints** surfaced through the API and dashboard.
- **Export generation** for EcoVadis-style outputs, including ZIP downloads with manifest and audit data.
- **Docker Compose** environment for repeatable local development.
- Clear separation between implemented MVP paths and future product work.

## Architecture

```text
                 ┌─────────────────┐
                 │ React / Vite UI │
                 └────────┬────────┘
                          │ JWT / REST
                          ▼
                  ┌──────────────┐
                  │   FastAPI    │
                  ├──────────────┤
                  │ auth         │
                  │ intake       │
                  │ validation   │
                  │ publish      │
                  │ exports      │
                  └──────┬───────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      PostgreSQL       Redis          MinIO
```

## Core workflow

1. Sign in and enter the protected application.
2. Select a supplier and reporting period.
3. Upload supplier sustainability data.
4. Track parsing and validation state.
5. Resolve warnings or errors.
6. Publish validated data.
7. Generate an export for the selected template.
8. Download the resulting ZIP with manifest and audit information.

## Current capabilities

- JWT login and protected routes.
- Supplier-data upload and validation lifecycle.
- Publish controls.
- Canonical ESRS-style datapoint dictionary exposed by the backend.
- EcoVadis export trigger and downloadable ZIP output.
- Seeded supplier, customer, request, and tenant data for demonstrations.
- Toast-based success/error feedback in the frontend.
- Automatic logout and redirect on unauthorized API responses.

Some secondary screens such as Requests, Customers, and Settings are structurally present but are not yet fully backed by dedicated production endpoints.

## Tech stack

- **Frontend:** React, Vite, Tailwind
- **Backend:** FastAPI, Python
- **Database:** PostgreSQL
- **Cache / infrastructure:** Redis
- **Object storage:** MinIO
- **Migrations:** Alembic
- **Dependency management:** Poetry
- **Local orchestration:** Docker Compose

## Quick start

### 1. Configure the environment

```bash
cp .env.example .env
```

`VITE_API_BASE` controls the frontend API URL and defaults to `http://localhost:8000`.

### 2. Start infrastructure

```bash
cd infra
docker compose up -d
```

### 3. Apply migrations and seed demo data

```bash
cd ../api
poetry install
poetry run alembic upgrade head
psql "$POSTGRES_URI" -f seed/demo_seed.sql
```

### 4. Run the frontend

```bash
cd ..
npm install
npm run dev
```

Open `http://localhost:5173`.

For a full walkthrough, see [`docs/local-development.md`](docs/local-development.md).

## Local demo data

The seed creates a demo tenant, user, supplier, customer, purpose, and data request so the complete intake/export workflow can be exercised locally.

Demo credentials are development-only fixtures. Do not reuse them outside the local environment.

## Quality checks

```bash
npm run lint
npm run build
poetry run pytest
```

The current repository is still an MVP, so test coverage and CI are areas for further expansion.

## Backend notes

- CORS origins are configured through `ALLOWED_ORIGINS`.
- Generated export artifacts are streamed through `GET /exports/jobs/{export_id}/download`.
- Local data directories are mounted through Docker volumes.
- Environment-specific secrets belong in `.env` or deployment secret stores; `.env` itself is ignored by Git.

## Project status

This repository intentionally reflects an MVP boundary rather than pretending every screen is production-complete.

Implemented end-to-end:

- authentication;
- supplier intake;
- validation state;
- publishing;
- canonical datapoints;
- export creation and download.

Planned follow-up areas include richer validation/evidence views, persistent metadata editing, background export queues, customer-facing workflows, broader automated test coverage, and production infrastructure.

## Scope

Sustain Gate is a portfolio/MVP project for exploring sustainability-data ingestion and workflow architecture. It is not a production ESG compliance platform and does not make regulatory compliance claims.
