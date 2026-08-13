import time
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Form

from database import get_connection
from schemas import UploadResponse
from dotenv import load_dotenv
from services.r2 import upload_bytes
from scheduler import schedule_deletion
from shortcode import generate_code

load_dotenv()

router = APIRouter()

MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB cap
DEFAULT_EXPIRY_SECONDS = 60 * 60  # 1 hour

HARD_MAX_DOWNLOADS = 25

MIN_EXPIRY_SECONDS = 5 * 60  # 5 minute
MAX_EXPIRY_SECONDS = 1 * 60 * 60  # 1 hour


def _generate_unique_code(conn) -> str:
    for _ in range(5):
        code = generate_code()
        exists = conn.execute(
            "SELECT 1 FROM files WHERE short_code = ?", (code,)
        ).fetchone()

        if not exists:
            return code
    raise RuntimeError("Could not generate a unique code after 5 attempts")


@router.post("/api/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    max_downloads: int = Form(1),
    expiry_seconds: int = Form(DEFAULT_EXPIRY_SECONDS),
):
    if max_downloads < 1 or max_downloads > HARD_MAX_DOWNLOADS:
        raise HTTPException(
            status_code=422,
            detail=f"max_downloads must be between 1 and {HARD_MAX_DOWNLOADS}",
        )
        
    if expiry_seconds < MIN_EXPIRY_SECONDS or expiry_seconds > MAX_EXPIRY_SECONDS:
        raise HTTPException(
            status_code=422,
            detail=f"expiry_seconds must be between {MIN_EXPIRY_SECONDS} and {MAX_EXPIRY_SECONDS}"
        )
        
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    file_id = str(uuid.uuid4())
    upload_bytes(object_key=file_id, data=contents)

    now = int(time.time())
    expires_at = now + expiry_seconds

    conn = get_connection()
    short_code = _generate_unique_code(conn)

    conn.execute(
        """
        INSERT INTO files 
        (id, short_code, original_filename, size_bytes, 
        created_at, expires_at, max_downloads, downloaded)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        """,
        (
            file_id,
            short_code,
            file.filename,
            len(contents),
            now,
            expires_at,
            max_downloads,
        ),
    )
    conn.commit()
    conn.close()

    schedule_deletion(file_id, expires_at)

    return UploadResponse(
        id=file_id,
        short_code=short_code,
        expires_at=expires_at,
    )
