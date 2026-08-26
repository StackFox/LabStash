# Contributing to LabStash

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Security Warning

> **The `backend/.env` file is committed to the repository and contains live credentials**
> (Cloudflare R2, Upstash Redis, Neon PostgreSQL). These should be rotated immediately
> and the file removed from git history. Do **not** add real secrets to any `.env` file
> that will be committed. Use `.env.example` as a template instead.

## Project Overview

LabStash is a temporary file-sharing service built for computer labs. Users upload files without an account, get a short code (like `ABC-234-XYZ`) and QR code, then download them later. Files auto-expire and have a download limit.

**Architecture:**

```
┌─────────────┐     API calls      ┌──────────────────┐
│  Next.js     │ ────────────────── │  FastAPI backend  │
│  (Vercel)    │                    │  (Render)         │
└─────────────┘                    └────────┬─────────┘
                                            │
                              ┌─────────────┼─────────────┐
                              │             │             │
                        ┌─────▼─────┐ ┌─────▼─────┐ ┌────▼────┐
                        │ PostgreSQL │ │ Cloudflare │ │  Redis  │
                        │ (Neon)     │ │ R2 (S3)   │ │(Upstash)│
                        └───────────┘ └───────────┘ └─────────┘
```

## Prerequisites

- **Backend**: Python 3.14+, [uv](https://docs.astral.sh/uv/)
- **Frontend**: [Bun](https://bun.sh/) (v1.3+)
- **Local services**: Docker (for Redis)

## Local Development Setup

### 1. Start Redis

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env    # fill in your own credentials
uv sync
uv run uvicorn main:app --reload
```

Server runs at `http://localhost:8000`. Interactive API docs at `/docs`.

### 3. Frontend

```bash
cd frontend
bun install
bun dev
```

App runs at `http://localhost:3000`.

## Project Structure

```
labstash/
├── backend/          # FastAPI API server
│   ├── routes/       # API endpoint handlers
│   ├── services/     # External service clients (R2)
│   ├── lib/          # Shared utilities (Redis)
│   └── tests/        # Pytest test suite
├── frontend/         # Next.js App Router frontend
│   ├── app/          # Pages and routes
│   ├── components/   # React components
│   ├── lib/api/      # API client functions
│   └── types/        # TypeScript interfaces
└── docker-compose.yaml  # Local Redis
```

## Database Schema

Two tables in PostgreSQL:

- **`uploads`** — one row per upload session (id, short_code, expiry, download limits)
- **`files`** — one row per file (references upload, stores R2 path and metadata)

See `backend/README.md` for the full schema and indexes.

## Making Changes

### Branch Naming

Use descriptive branch names:

```
feat/add-bulk-download
fix/rate-limit-overflow
docs/update-api-reference
```

### Backend Changes

1. Create a branch from `main`
2. Make your changes in `backend/`
3. Run tests: `cd backend && uv run pytest tests/ -v`
4. Ensure the dev server starts without errors

### Frontend Changes

1. Create a branch from `main`
2. Make your changes in `frontend/`
3. Run the linter: `cd frontend && bun lint`
4. Verify the page renders correctly in the browser

### Commit Messages

Follow conventional commits:

```
feat: add bulk download endpoint
fix: handle expired uploads in cleanup sweep
docs: add API reference to README
refactor: extract rate limiter into separate module
```

## Code Style

### Python (Backend)

- Follow existing patterns — the codebase uses dictionary-style DB rows (`conn["column"]`)
- Use `get_connection()` as a context manager for DB access
- Handle errors explicitly in route handlers (raise `HTTPException` with appropriate status codes)
- Tests use `unittest.mock.patch` — follow the existing test patterns in `tests/`

### TypeScript (Frontend)

- ESLint with `eslint-config-next` — run `bun lint` before pushing
- Components use `'use client'` directive where state/effects are needed
- API functions live in `lib/api/` and throw `DownloadApiError` for error handling
- Use explicit status state machines (not scattered booleans) for complex UI states

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload files |
| `GET` | `/api/files/{id}` | List files (manifest) |
| `GET` | `/api/download/{id}` | Download as ZIP |
| `DELETE` | `/api/delete/{id}` | Delete upload |

Short codes are rate-limited to 10 requests per 60 seconds. See `backend/README.md` for full details.

## Open Issues

Check the repository issues for tasks labeled `good first issue` or `help wanted`.

## Questions?

Open a GitHub issue or reach out to the maintainers.
