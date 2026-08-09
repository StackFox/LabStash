import time
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from database import get_connection
from schemas import UploadResponse
from dotenv import load_dotenv
from services.r2 import upload_bytes
from scheduler import schedule_deletion
from shortcode import generate_code

load_dotenv()

router = APIRouter()

MAX_FILE_SIZE = 200 * 1024 * 1024  # 200 MB cap
DEFAULT_EXPIRY_SECONDS = 15 * 60 # 15 minutes


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
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    file_id = str(uuid.uuid4())
    upload_bytes(object_key=file_id, data=contents)

    now = int(time.time())
    expires_at = now + DEFAULT_EXPIRY_SECONDS

    conn = get_connection()
    short_code = _generate_unique_code(conn)
    
    conn.execute(
        """
        INSERT INTO files (id, short_code, storage_path, original_filename, size_bytes, created_at, expires_at, downloaded)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        """,
        (file_id, short_code, file_id, file.filename, len(contents), now, expires_at),
    )
    conn.commit()
    conn.close()
    
    schedule_deletion(file_id, expires_at)

    return UploadResponse(id=file_id, short_code=short_code, expires_at=expires_at)
