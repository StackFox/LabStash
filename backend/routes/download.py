import os
import time

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from database import get_connection
from services.r2 import download_bytes, object_exists, delete_object

router = APIRouter()


@router.get("/api/download/{file_id}")
async def download_file(file_id: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM files WHERE id = ?", (file_id,)
    ).fetchone()

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

    conn.execute(
        "UPDATE files SET downloaded = 1 WHERE id = ?", (file_id,)
    )
    conn.commit()
    conn.close()

    return Response(
        content=contents,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{file_id}.enc"'},
    )

def _delete_file_record(conn, row):
    delete_object(row["storage_path"])
    conn.execute("DELETE FROM files WHERE id = ?", (row["id"],))
    conn.commit()
