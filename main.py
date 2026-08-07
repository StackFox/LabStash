from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_connection
from routes import upload
from routes import download
from scheduler import reconcile_pending_deletions

CLEANUP_INTERVAL_SECONDS = 15 * 60  # check for expired files every 15 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when the server starts up.
    init_db()
    reconcile_pending_deletions()
    yield

app = FastAPI(
    title="LabStash API", 
    lifespan=lifespan
)

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
