import asyncio
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_connection
from routes import upload, download
from scheduler import reconcile_pending_deletions, schedule_deletion

CLEANUP_INTERVAL_SECONDS = 15 * 60  # check for expired files every 15 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when the server starts up.
    init_db()
    reconcile_pending_deletions()
    # Periodic sweep for expired files that may have been missed by the
    # in-memory scheduler tasks (e.g. after a crash or restart gap).
    async def _periodic_cleanup():
        while True:
            await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
            try:
                conn = get_connection()
                now = int(time.time())
                expired = conn.execute(
                    "SELECT id, expires_at FROM uploads WHERE expires_at < ?",
                    (now,),
                ).fetchall()
                conn.close()
                for row in expired:
                    schedule_deletion(row["id"], row["expires_at"])
            except Exception:
                pass  # best-effort; next tick will retry
    asyncio.create_task(_periodic_cleanup())
    yield

app = FastAPI(
    title="LabStash API", 
    lifespan=lifespan
)

# CORS origins: comma-separated env var, defaults to allow all for dev.
_cors_env = os.getenv("CORS_ORIGINS", "")
_allowed_origins = [o.strip() for o in _cors_env.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(upload.router)
app.include_router(download.router)


@app.get("/")
async def root():
    return {"status": "ok"}
