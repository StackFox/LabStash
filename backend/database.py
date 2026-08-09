import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "storage" / "app.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # lets us access columns by name, e.g. row["id"]
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            short_code TEXT UNIQUE NOT NULL,
            storage_path TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            downloaded INTEGER NOT NULL DEFAULT 0
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_expires_at ON files(expires_at)
    """)
    conn.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_short_code ON files(short_code)
    """)
    conn.commit()
    conn.close()
