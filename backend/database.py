from threading import Lock

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from config import NEON_DB_URL

_pool: ConnectionPool | None = None
_pool_lock = Lock()


def _get_pool() -> ConnectionPool:
    global _pool

    if not NEON_DB_URL:
        raise RuntimeError(
            "NEON_DB_URL is required to connect to the PostgreSQL database. "
            "Set it in the environment before starting the backend."
        )

    if _pool is None:
        with _pool_lock:
            if _pool is None:
                _pool = ConnectionPool(
                    conninfo=NEON_DB_URL,
                    min_size=1,
                    max_size=5,
                    kwargs={"row_factory": dict_row},
                    # Neon may terminate idle connections during restarts or
                    # compute suspend/resume. Validate pooled connections
                    # before handing them to a request.
                    check=ConnectionPool.check_connection,
                    max_idle=60,
                    max_lifetime=300,
                    open=True,
                )
    return _pool


def get_connection():
    """Return a pooled connection context manager with dictionary-style rows."""
    return _get_pool().connection()


def init_db():
    with get_connection() as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS uploads (
            id TEXT PRIMARY KEY,
            short_code TEXT UNIQUE NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            max_downloads INTEGER NOT NULL DEFAULT 1,
            download_count INTEGER NOT NULL DEFAULT 0
        )          
        """)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            upload_id TEXT NOT NULL REFERENCES uploads(id),
            storage_path TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            size_bytes INTEGER NOT NULL
        )
        """)

        conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_files_upload_id ON files(upload_id);
        """)

        conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_expires_at ON uploads(expires_at);
        """)

        conn.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_short_code ON uploads(short_code);
        """)
        conn.commit()
