import asyncio
import time

from database import get_connection
from services.r2 import delete_object

_pending_tasks: dict[str, asyncio.Task] = {}

async def _delete_after_delay(file_id: str, delay_seconds: float):
    if delay_seconds > 0:
        await asyncio.sleep(delay_seconds)
        
    conn = get_connection()
    row = conn.execute("SELECT * FROM files WHERE id = ?", (file_id,)).fetchone()
    
    if row is not None:
        delete_object(row["id"])
        conn.execute("DELETE FROM files WHERE id = ?", (file_id,))
        conn.commit()
    
    conn.close()
    _pending_tasks.pop(file_id, None)
 
    
def schedule_deletion(file_id: str, expires_at: int):
    delay = expires_at - int(time.time())
    task = asyncio.create_task(_delete_after_delay(file_id, delay))
    _pending_tasks[file_id] = task
    

def reconcile_pending_deletions():
    conn = get_connection()
    rows = conn.execute("SELECT id, expires_at FROM files").fetchall()
    conn.close()
    
    for row in rows:
        schedule_deletion(row["id"], row["expires_at"])