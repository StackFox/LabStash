# LabStash Backend

FastAPI backend for the LabStash temporary file-sharing service.

## Tech Stack

- **Python 3.14** with FastAPI
- **PostgreSQL** (Neon) for upload/file metadata
- **Cloudflare R2** (S3-compatible) for file object storage
- **Upstash Redis** for manifest caching
- **uv** for dependency management

## Getting Started

```bash
# Install dependencies
uv sync

# Copy and fill in environment variables
cp .env.example .env

# Run the dev server
uv run uvicorn main:app --reload
```

The server starts at `http://localhost:8000`. API docs are available at `/docs`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEON_DB_URL` | PostgreSQL connection string (Neon) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `REDIS_URL` | Upstash Redis URL |
| `CORS_ORIGINS` | Comma-separated allowed origins (default: `*`) |

## Project Structure

```
backend/
├── main.py              # FastAPI app, lifespan, CORS, periodic cleanup
├── config.py            # Environment variable loader
├── database.py          # PostgreSQL connection pool (psycopg)
├── schemas.py           # Pydantic response models
├── shortcode.py         # Short-code generator (ABC-234-XYZ format)
├── scheduler.py         # In-memory async deletion scheduler
├── compressor.py        # ZIP creation from R2-stored files
├── routes/
│   ├── upload.py        # POST /api/upload
│   ├── download.py      # GET /api/files, GET /api/download
│   └── delete_now.py    # DELETE /api/delete
├── services/
│   └── r2.py            # Cloudflare R2 (S3) client
├── lib/
│   └── redis.py         # Redis async client
└── tests/
    └── test_delete_now.py
```

## API Endpoints

### `POST /api/upload`

Upload one or more files. Returns a short code and upload ID.

| Param | Type | Limits |
|-------|------|--------|
| `files` | multipart | Max 10 files, 50 MB each, 500 MB total |
| `max_downloads` | int | 1--25 (default: 1) |
| `expiry_seconds` | int | 300--3600 (default: 3600) |

### `GET /api/files/{identifier}`

List files in an upload. Accepts a UUID or short code. Returns file manifest with download counters. Cached in Redis for 5 minutes. Short-code lookups are rate-limited (10 requests per 60 seconds).

### `GET /api/download/{identifier}`

Download all files as a ZIP. Atomically increments the download counter with a row-level lock (`FOR UPDATE`). Rolls back the counter if ZIP creation fails.

### `DELETE /api/delete/{identifier}`

Immediately delete an upload and its files from R2 and the database. Idempotent — returns `already_deleted` if the upload is already gone.

## Database Schema

```sql
CREATE TABLE uploads (
    id            TEXT PRIMARY KEY,
    short_code    TEXT UNIQUE NOT NULL,
    created_at    INTEGER NOT NULL,
    expires_at    INTEGER NOT NULL,
    max_downloads INTEGER NOT NULL DEFAULT 1,
    download_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE files (
    id                 TEXT PRIMARY KEY,
    upload_id          TEXT NOT NULL REFERENCES uploads(id),
    storage_path       TEXT NOT NULL,
    original_filename  TEXT NOT NULL,
    size_bytes         INTEGER NOT NULL
);
```

Indexes: `idx_files_upload_id`, `idx_expires_at`, `idx_short_code` (unique).

## How Auto-Deletion Works

1. On upload, `schedule_deletion()` creates an `asyncio.Task` that sleeps until `expires_at`.
2. On startup, `reconcile_pending_deletions()` reschedules all existing uploads.
3. A periodic sweep (every 15 minutes) catches any uploads missed by the in-memory scheduler (e.g. after a crash).
4. When the task fires, it deletes objects from R2, then removes rows from `files` and `uploads`.

## Running Tests

```bash
uv run pytest tests/ -v
```
