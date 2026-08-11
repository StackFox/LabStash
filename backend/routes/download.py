import time
import re

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from database import get_connection
from services.r2 import download_bytes, object_exists, delete_object

router = APIRouter()

_attempt_counts: dict[str, list[float]] = {}
MAX_ATTEMPTS = 10
WINDOW_SECONDS = 60

UUID_PATTERN = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE)

def _check_rate_limit(code: str):
    now = time.time()
    attempts = _attempt_counts.setdefault(code, [])
    attempts[:] = [t for t in attempts if now - t < WINDOW_SECONDS]
    if len(attempts) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429, detail="Too many attempts, try again later"
        )
    attempts.append(now)


@router.get("/api/download/{identifier}")
async def download_file(identifier: str):
    
    conn = get_connection()
    # file id
    if UUID_PATTERN.match(identifier):
        row = conn.execute("SELECT * FROM files WHERE id = ?", (identifier,)).fetchone()
        conn.execute("UPDATE files SET downloaded = downloaded + 1 WHERE id = ?", (identifier,))
    # short code
    else:
        short_code = identifier.strip().upper()
        _check_rate_limit(short_code)
        row = conn.execute("SELECT * FROM files WHERE short_code = ?", (short_code,)).fetchone()
        conn.execute("UPDATE files SET downloaded = downloaded + 1 WHERE short_code = ?", (identifier,))
        

    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="File not found")

    now = int(time.time())
    if row["expires_at"] < now:
        _delete_file_record(conn, row)
        conn.close()
        raise HTTPException(status_code=410, detail="File has expired")

    object_key = row["storage_path"]
    if not object_exists(object_key):
        conn.close()
        raise HTTPException(status_code=404, detail="File not found")

    contents = download_bytes(object_key)

    conn.commit()
    original_filename = row["original_filename"]
    conn.close()

    return Response(
        content=contents,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{original_filename}"'},
    )


def _delete_file_record(conn, row):
    delete_object(row["storage_path"])
    conn.execute("DELETE FROM files WHERE id = ?", (row["id"],))
    conn.commit()
