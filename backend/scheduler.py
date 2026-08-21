import asyncio
import time

from database import get_connection
from services.r2 import delete_object

_pending_tasks: dict[str, asyncio.Task] = {}

async def _delete_after_delay(upload_id: str, delay_seconds: float):
    if delay_seconds > 0:
        await asyncio.sleep(delay_seconds)

    try:
        with get_connection() as conn:
            file_rows = conn.execute(
                "SELECT storage_path FROM files WHERE upload_id = %s", (upload_id,)
            ).fetchall()

            if not file_rows:
                return

            for file in file_rows:
                try:
                    delete_object(file["storage_path"])
                except Exception:
                    pass  # best-effort R2 cleanup; DB still gets cleaned below

            conn.execute("DELETE FROM files WHERE upload_id = %s", (upload_id,))
            conn.execute("DELETE FROM uploads WHERE id = %s", (upload_id,))
            conn.commit()
    finally:
        _pending_tasks.pop(upload_id, None)
 
    
def schedule_deletion(upload_id: str, expires_at: int):
    delay = expires_at - int(time.time())
    task = asyncio.create_task(_delete_after_delay(upload_id, delay))
    _pending_tasks[upload_id] = task
    

def reconcile_pending_deletions():
    with get_connection() as conn:
        rows = conn.execute("SELECT id, expires_at FROM uploads").fetchall()
    
    for row in rows:
        schedule_deletion(row["id"], row["expires_at"])
