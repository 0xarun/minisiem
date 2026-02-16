# MiniSIEM

MiniSIEM is a lightweight SIEM-style log explorer inspired by Elastic Discover (without histogram). It ingests logs from files or raw text, parses structured and unstructured events, stores them in PostgreSQL, and provides a searchable Discover UI.

## Features

- Upload `.log`, `.json`, `.zip` (up to 5 files inside zipped uploads), or paste raw logs.
- Auto parser:
  - JSON line logs
  - `key=value` logs
  - unstructured raw logs
- PostgreSQL storage with JSONB + timestamp indexes.
- Discover dashboard with:
  - Search syntax (`field:value`, `AND`, `OR`, `NOT`)
  - Time range dropdown (`15m`, `1h`, `24h`, `7d`, `30d`, `custom`)
  - Include/exclude filter pills
  - Field sidebar with top values + counts
  - Toggleable columns and sortable table
  - Expand row JSON details
  - Pagination
- Server-side filtering and pagination.
- Dockerized stack and GitHub Actions workflows.

## Architecture

```text
Browser
  ↕
Next.js Frontend (3000)
  ↕ REST
FastAPI Backend (8000)
  ↕
PostgreSQL (5432)
```

## Project Structure

```text
minisiem/
├── backend/
├── frontend/
├── docker-compose.yml
├── .env.example
└── .github/workflows/
```

## Database Schema

### `datasets`
- `id UUID PRIMARY KEY`
- `name TEXT`
- `created_at TIMESTAMP`

### `logs`
- `id UUID PRIMARY KEY`
- `dataset_id UUID REFERENCES datasets(id)`
- `line_number INT`
- `timestamp TIMESTAMP NULL`
- `raw_message TEXT`
- `parsed_fields JSONB`

Indexes:
- `GIN(parsed_fields)`
- `BTREE(timestamp)`

## Setup

1. Copy environment values:

```bash
cp .env.example .env
```

2. Start services:

```bash
docker compose up --build
```

3. Open:
- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `POST /upload`
  - multipart form: `dataset_name`, optional `files[]`, optional `raw_logs`
- `GET /datasets`
- `GET /datasets/{id}/fields`
- `POST /datasets/{id}/logs/search`

Example search request:

```json
{
  "query": "host:web01 AND status:failed",
  "time_from": "2025-01-01T00:00:00Z",
  "time_to": "2025-01-02T00:00:00Z",
  "filters": [
    {"field": "host", "value": "abc", "type": "include"},
    {"field": "status", "value": "error", "type": "exclude"}
  ],
  "page": 1,
  "page_size": 100
}
```

## Deploying on Render / VPS

- Use managed PostgreSQL (Render Postgres).
- Deploy backend and frontend as separate Docker services.
- Set env vars:
  - `DATABASE_URL`
  - `CORS_ORIGINS`
  - `NEXT_PUBLIC_API_URL`
- Put a custom domain in front of frontend.
- Enable TLS/HTTPS at load balancer/proxy.

## Development Workflow

- Create branch and implement feature.
- Run checks:
  - Backend: `ruff check app`, `python -m compileall app`
  - Frontend: `npm run lint`, `npm run build`
- Commit + open PR.

## Troubleshooting

- **Frontend cannot reach backend**:
  - verify `NEXT_PUBLIC_API_URL` points to backend base URL.
- **DB connection errors**:
  - verify `DATABASE_URL` driver is `postgresql+asyncpg://`.
- **No timestamps available**:
  - time filtering is automatically skipped in effect if no timestamp is parsed.
- **Zip upload rejected**:
  - zip internal file count exceeds configured limit.
