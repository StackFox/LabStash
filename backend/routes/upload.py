import time
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException, Form

from database import get_connection
from schemas import UploadResponse
from dotenv import load_dotenv
from services.r2 import upload_bytes
from scheduler import schedule_deletion
from shortcode import generate_code

load_dotenv()

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB cap
MAX_FILES_PER_UPLOAD = 10
MAX_TOTAL_SIZE = 500 * 1024 * 1024 # 500 MB 

DEFAULT_EXPIRY_SECONDS = 60 * 60  # 1 hour

MIN_EXPIRY_SECONDS = 5 * 60  # 5 minute
MAX_EXPIRY_SECONDS = 1 * 60 * 60  # 1 hour

HARD_MAX_DOWNLOADS = 25


def _generate_unique_code(conn) -> str:
    for _ in range(5):
        code = generate_code()
        exists = conn.execute(
            "SELECT 1 FROM files WHERE id = ?", (code,)
        ).fetchone()

        if not exists:
            return code
    raise RuntimeError("Could not generate a unique code after 5 attempts")


@router.post("/api/upload", response_model=UploadResponse)
async def upload_files(
    files: list[UploadFile] = File(...),
    max_downloads: int = Form(1),
    expiry_seconds: int = Form(DEFAULT_EXPIRY_SECONDS),
):
    if not files:
        raise HTTPException(status_code=422, detail="No files provided")
    
    if len(files) > MAX_FILES_PER_UPLOAD:
        raise HTTPException(
            status_code=422,
            detail=f"Cannot upload more than {MAX_FILES_PER_UPLOAD} files at once"
        )
    
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
        
    file_contents = []
    total_size = 0
    
    for file in files:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"{file.filename} exceeds the per-file size limit"
            )
        total_size += len(contents)
        file_contents.append((file.filename, contents))

    if total_size > MAX_TOTAL_SIZE:
        raise HTTPException(status_code=413, detail=f"Combined upload size exceeds the session limit of {MAX_TOTAL_SIZE}")

    upload_id = str(uuid.uuid4())
    now = int(time.time())
    expires_at = now + expiry_seconds

    conn = get_connection()
    short_code = _generate_unique_code(conn)

    conn.execute(
        """
        INSERT INTO uploads 
        (id, short_code, created_at, expires_at, 
        max_downloads, download_count)
        VALUES (?, ?, ?, ?, ?, 0)
        """,
        (
            upload_id,
            short_code,
            now,
            expires_at,
            max_downloads
        ),
    )
    
    for filename, contents in file_contents:
        file_id = str(uuid.uuid4())
        storage_path = f"{upload_id}/{file_id}"
        upload_bytes(object_key=storage_path, data=contents)
        conn.execute(
            """
            INSERT INTO files (id, upload_id, storage_path, original_filename, size_bytes)
            VALUES (?, ?, ?, ?, ?)
            """,
            (file_id, upload_id, storage_path, filename, len(contents)),
        )
    
    conn.commit()
    conn.close()

    schedule_deletion(upload_id, expires_at)

    return UploadResponse(
        id=upload_id,
        short_code=short_code,
        expires_at=expires_at,
    )
