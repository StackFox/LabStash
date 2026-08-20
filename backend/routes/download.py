import time
import re
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from redis.exceptions import RedisError
from lib.redis import redis_client as redis_client

from compressor import create_zip, stream_zip
from database import get_connection
from services.r2 import delete_object, object_exists

router = APIRouter()

_attempt_counts: dict[str, list[float]] = {}
MAX_ATTEMPTS = 10
WINDOW_SECONDS = 60
_RATE_LIMITER_SWEEP_INTERVAL = 300  # prune stale entries every 5 minutes
_last_sweep = 0.0

UUID_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE
)


def _check_rate_limit(code: str):
    global _last_sweep
    now = time.time()

    # Periodic cleanup of stale entries to prevent unbounded memory growth.
    if now - _last_sweep > _RATE_LIMITER_SWEEP_INTERVAL:
        _last_sweep = now
        stale = [
            key for key, attempts in _attempt_counts.items()
            if not attempts or now - attempts[-1] > WINDOW_SECONDS
        ]
        for key in stale:
            _attempt_counts.pop(key, None)

    attempts = _attempt_counts.setdefault(code, [])
    attempts[:] = [t for t in attempts if now - t < WINDOW_SECONDS]
    if len(attempts) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429, detail={"message": "Too many attempts", "retry_after": WINDOW_SECONDS}
        )
    attempts.append(now)


def _resolve_session(conn, identifier: str):
    if UUID_PATTERN.match(identifier):
        # id — normalize to lowercase to match stored UUIDs
        return conn.execute(
            """SELECT * FROM uploads WHERE id = ?""", (identifier.lower(),)
        ).fetchone()
    # short_code
    code = identifier.strip().upper()
    _check_rate_limit(code)
    return conn.execute(
        "SELECT * FROM uploads WHERE short_code = ?", (code,)
    ).fetchone()


@router.get("/api/files/{identifier}")
async def list_files(identifier: str):
    conn = get_connection()
    session = _resolve_session(conn, identifier)

    if session is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Not found")

    if session["expires_at"] < int(time.time()):
        conn.close()
        raise HTTPException(status_code=410, detail="This upload has expired")

    normalized_code = identifier.strip().upper()
    cache_key = f"manifest:v1:{normalized_code}"
    manifest = None

    try:
        cached_manifest = await redis_client.get(cache_key)
        if cached_manifest:
            manifest = json.loads(cached_manifest)
    except (RedisError, json.JSONDecodeError):
        manifest = None

    if manifest is None:
        files = conn.execute(
            "SELECT id, original_filename, size_bytes FROM files WHERE upload_id = ?",
            (session["id"],),
        ).fetchall()

        manifest = {
            "files": [
                {
                    "file_id": row["id"],
                    "filename": row["original_filename"],
                    "size_bytes": row["size_bytes"],
                }
                for row in files
            ]
        }

        try:
            await redis_client.set(cache_key, json.dumps(manifest), ex=300)
        except RedisError:
            pass

    current = conn.execute(
        """
      SELECT download_count, max_downloads
      FROM uploads
      WHERE id = ?
      """,
        (session["id"],),
    ).fetchone()
    conn.close()

    response_data = {
        **manifest,
        "download_count": current["download_count"],
        "max_downloads": current["max_downloads"],
        "downloads_remaining": max(
            0,
            current["max_downloads"] - current["download_count"],
        ),
    }

    return response_data


@router.get("/api/download/{identifier}")
async def download_file(identifier: str):
    conn = get_connection()
    session = _resolve_session(conn, identifier)

    if session is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Not found")

    if session["expires_at"] < int(time.time()):
        conn.close()
        raise HTTPException(status_code=410, detail="This upload has expired")

    file_rows = conn.execute(
        "SELECT storage_path, original_filename FROM files WHERE upload_id = ?",
        (session["id"],),
    ).fetchall()
    if not file_rows:
        conn.close()
        raise HTTPException(status_code=404, detail="No files found for this upload")

    zip_files = []
    for row in file_rows:
        storage_path = row["storage_path"]
        if not object_exists(storage_path):
            # Support uploads created before storage paths were namespaced by upload.
            legacy_path = storage_path.rsplit("/", 1)[-1]
            if not object_exists(legacy_path):
                conn.close()
                raise HTTPException(
                    status_code=404,
                    detail="A file in this upload is no longer available",
                )
            storage_path = legacy_path
        zip_files.append((storage_path, row["original_filename"]))

    updated = conn.execute(
        """
      UPDATE uploads
      SET download_count = download_count + 1
      WHERE id = ?
        AND download_count < max_downloads
        AND expires_at >= ?
      RETURNING download_count, max_downloads
      """,
        (session["id"], int(time.time())),
    ).fetchone()

    if updated is None:
        conn.close()
        raise HTTPException(status_code=410, detail="Download limit reached")

    conn.commit()
    conn.close()

    try:
        zip_stream = create_zip(zip_files)
    except Exception:
        # Roll back the download credit so the user isn't penalized
        # for a zip-creation failure (e.g. R2 download error).
        conn = get_connection()
        try:
            conn.execute(
                "UPDATE uploads SET download_count = download_count - 1 WHERE id = ?",
                (session["id"],),
            )
            conn.commit()
        finally:
            conn.close()
        raise

    return StreamingResponse(
        stream_zip(zip_stream),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="labstash-{session["short_code"]}.zip"'
        },
    )
