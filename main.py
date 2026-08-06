import asyncio
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_connection
from routes import upload
from routes import download

CLEANUP_INTERVAL_SECONDS = 15 * 60  # check for expired files every 15 minutes

async def cleanup_expired_files():
    while True:
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
        now = int(time.time())
        conn = get_connection()
        expired = conn.execute(
            "SELECT * FROM files WHERE expires_at < ?", (now,)
        ).fetchall()

        for row in expired:
            if os.path.exists(row["storage_path"]):
                os.remove(row["storage_path"])
            conn.execute("DELETE FROM files WHERE id = ?", (row["id"],))

        conn.commit()
        conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when the server starts up.
    init_db()
    cleanup_task = asyncio.create_task(cleanup_expired_files())
    yield
    # Runs once when the server shuts down.
    cleanup_task.cancel()

app = FastAPI(title="LabStash API", lifespan=lifespan)


# CORS lets your Next.js frontend (running on a different port/domain)
# call this API from the browser. Tighten allow_origins to your actual
# frontend URL before deploying - "*" is only fine for local dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(download.router)


@app.get("/")
async def root():
    return {"status": "ok"}
