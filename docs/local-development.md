# Local Development Guide

This guide walks through setting up the Supplier Sustainability Data Router (SSDR) on a brand
new workstation. Follow each section in order to bring up the full stack and validate that the
system is healthy.

## 1. Prerequisites

Install the following tooling before proceeding:

- **Git** 2.30+
- **Docker Desktop** (or Docker Engine) with **Docker Compose v2**
- **Node.js** 18.x (ships with `npm`)
- **Python** 3.11 along with **Poetry** 1.5+
- Optional but recommended: **psql** client for running the demo seed script

> ℹ️  All commands in this document are shown relative to the repository root unless noted.

## 2. Clone the repository

```bash
git clone https://github.com/your-org/ssdr.git
cd ssdr
```

## 3. Configure environment variables

Copy the example environment file and adjust values if needed. The defaults work for the local
Docker stack and the development credentials bundled with the project.

```bash
cp .env.example .env
```

Key values to verify:

- `VITE_API_BASE` – URL the frontend uses to talk to the API (defaults to `http://localhost:8000`).
- `POSTGRES_URI` – connection string consumed by Alembic migrations and background jobs.
- `JWT_SECRET` – used by the backend to sign and validate access tokens.

## 4. Install JavaScript dependencies

```bash
npm install
```

This installs the Vite + React frontend dependencies into `node_modules/`.

## 5. Start the infrastructure stack

Use the provided Compose file to boot the services SSDR depends on (Postgres, Redis, MinIO,
FastAPI API, background worker, and the optional frontend container).

```bash
cd infra
docker compose up -d
```

The compose file automatically waits for health checks on Postgres, Redis, and MinIO before
starting the API. Check container health at any time with:

```bash
docker compose ps
```

> To tear everything down later run `docker compose down -v` from the same directory.

## 6. Prepare the backend

With the containers running, install Python dependencies and run database migrations.

```bash
cd ../api
poetry install
poetry run alembic upgrade head
```

The initial migration also runs `rls.sql` to configure the row-level security helpers used by the
application. If you have the `psql` client available you can load the optional demo dataset:

```bash
psql "$POSTGRES_URI" -f seed/demo_seed.sql
```

This creates a demo tenant, user, supplier, customer, and data request that unlock the upload and
export flows in the UI.

## 7. Run the frontend

Open a new terminal, navigate back to the repository root, and start the Vite development server.

```bash
npm run dev
```

Access the UI at [http://localhost:5173](http://localhost:5173). Log in with the seeded
credentials `admin@demo.local / admin123`. The app will redirect to `/login` automatically if the
JWT expires or is removed.

## 8. (Optional) Run background worker locally

If you want to execute long-running export tasks outside of Docker, activate the Poetry environment
and run the worker entrypoint. This mirrors what the `worker` service in Compose does.

```bash
cd api
poetry run python -m worker.main
```

## 9. Quality checks

Before committing changes, make sure linting and build steps pass:

```bash
npm run lint
npm run build
poetry run pytest
```

The test suite is currently light but validates that dependencies import correctly and the virtual
environment is healthy.

## 10. Troubleshooting

- **Database connection errors**: confirm the `db` container is healthy (`docker compose ps`) and
  that your shell inherits the same environment variables (`POSTGRES_URI`).
- **Frontend cannot reach API**: ensure `VITE_API_BASE` matches the host/port where the API is
  exposed. When running the API inside Docker on macOS/Windows, `http://localhost:8000` is the
  correct value.
- **Large file upload fails**: uploads above 10 MB are intentionally rejected (HTTP 413) to protect
  the API. Use smaller files in development.
- **MinIO credentials**: access the MinIO console at [http://localhost:9001](http://localhost:9001)
  with `minioadmin / minioadmin`.

You now have the full SSDR stack running locally and can iterate on the frontend, backend, or
worker services as needed.
