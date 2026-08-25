from fastapi import APIRouter, HTTPException
from database import get_connection
from routes.download import resolve_session
from services.r2 import delete_object

router = APIRouter()


@router.delete("/api/delete/{identifier}")
async def delete_files(identifier: str):
    with get_connection() as conn:
        session = resolve_session(conn, identifier)

        if session is None:
            return {"status": "already_deleted"}

        session = conn.execute(
            "SELECT * FROM uploads WHERE id = %s FOR UPDATE",
            (session["id"],),
        ).fetchone()
        if session is None:
            return {"status": "already_deleted"}

        file_rows = conn.execute(
            "SELECT storage_path FROM files WHERE upload_id = %s",
            (session["id"],),
        ).fetchall()

        storage_error = None
        for file in file_rows:
            try:
                delete_object(file["storage_path"])
            except Exception as exc:
                storage_error = storage_error or exc

        if storage_error is not None:
            conn.rollback()
            raise HTTPException(status_code=503, detail="Storage deletion failed") from storage_error

        conn.execute("DELETE FROM files WHERE upload_id = %s", (session["id"],))
        conn.execute("DELETE FROM uploads WHERE id = %s", (session["id"],))
        conn.commit()
    return {"status": "deleted", "upload_id": session["id"]}
