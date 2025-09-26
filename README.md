# Supplier Sustainability Data Router (SSDR)

This repository contains the SSDR MVP: a Vite + React + Tailwind frontend and a FastAPI
backend stitched together to deliver the upload → validate → publish → export lifecycle for ESG
supplier data.

## Blueprint audit (MVP scope)

| Area | Blueprint expectation | Current state | Follow-up
| --- | --- | --- | --- |
| Auth | Password + JWT login, route protection, logout | Implemented with `/auth/token`, local storage token, guards, and automatic 401 recovery | Fase 2: swap fake user for real directory / OAuth
| Intake pipeline | Upload, validate, publish, status feedback | Fully wired to FastAPI with toasts, retry, and publish control | Extend validation logic + evidence previews
| Exports | Trigger EcoVadis export and download ZIP | `/exports/{template}` wired from UI, download endpoint added | Add background queue + historical list from DB
| Datapoints | Canonical ESRS datapoint dictionary | Served from API and surfaced on dashboard | Persist datapoint metadata + editing UI
| Requests / Customers / Settings | Structural UI ready for data | Still mocked, typed placeholders only | Hook up to dedicated endpoints once ready
| DevOps | Docker compose, migrations, seeds, documentation | Added demo seed SQL, env examples, README quickstart | Add CI (lint/build) and production IaC in later phase

## Quickstart

Looking for a detailed step-by-step walkthrough? Check out the
[Local Development Guide](docs/local-development.md).

### 1. Configure environment variables

```bash
cp .env.example .env
```

`VITE_API_BASE` controls the frontend ↔ backend communication URL. Default points to
`http://localhost:8000`.

### 2. Launch the stack

```bash
cd infra
docker compose up -d
```

This brings up Postgres, Redis, MinIO, the FastAPI service and (optionally) the frontend.

### 3. Apply migrations & seed demo data

```bash
cd ../api
poetry install
poetry run alembic upgrade head
psql "$POSTGRES_URI" -f seed/demo_seed.sql   # requires psql installed locally
```

The seed creates:

- Tenant `Demo Tenant GmbH`
- User `admin@demo.local` with the fixed UUID expected by the fake JWT
- Supplier `DEMO Supplier Ltd` (used in the UI dropdowns)
- Customer + purpose + data request to unlock the export flow

### 4. Run the frontend

```bash
cd ..
npm install
npm run dev
```

Log in at `http://localhost:5173/login` with `admin@demo.local / admin123`.

## End-to-end checklist

1. **Login** – `/login` posts to `/auth/token`, persists the JWT in `localStorage`, and redirects to
   the requested protected route.
2. **Protected routes** – navigating to `/`, `/upload`, `/exports`, `/requests`, `/customers`, or
   `/settings` requires the JWT and automatically redirects to `/login` on 401.
3. **Upload flow** – select the seeded supplier + reporting window, upload a CSV, watch status
   transition from `uploading → parsing → validating`, resolve warnings/errors, publish when
   ready.
4. **Export flow** – pick the EcoVadis template, supplier, request and period, trigger the export,
   then download the generated ZIP (contains `manifest.json` and `audit.json`).
5. **Logout** – use the top bar button or hit any 401 to clear the session and go back to `/login`.

## Frontend tips

- Toasts surface success and failure states for every network call.
- The API client automatically clears the token and redirects when a 401 is returned.
- The dashboard already consumes the canonical datapoints endpoint to highlight blueprint coverage.

## Backend notes

- Update CORS origins via `ALLOWED_ORIGINS` in `api/app/config.py` (also exposed in
  `infra/docker-compose.yml`).
- `GET /exports/jobs/{export_id}/download` streams the generated ZIPs to the browser.
- Data directories under `/data` are created automatically; the compose file mounts them via
  `api_data` volume.

## Linting & builds

Run the standard quality gates before opening a PR:

```bash
npm run lint
npm run build
poetry run pytest  # optional today (no tests yet) but ensures the env is healthy
```

## Contributing

- Keep feature work on the `main` branch for now (no branching policy defined).
- Avoid committing secrets – `.env` is git-ignored and `.env.example` documents required vars.
- Future roadmap: OAuth, worker queue for exports, customer-facing dashboards, CI workflows.
