import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "storage" / "app.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")  # enable foreign keys
    return conn


def init_db():
    conn = get_connection()

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
    conn.close()
