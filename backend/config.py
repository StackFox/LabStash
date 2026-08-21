from dotenv import load_dotenv
import os

load_dotenv()

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
NEON_DB_URL = os.getenv("NEON_DB_URL")
