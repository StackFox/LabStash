from config import REDIS_URL
import redis.asyncio as redis

redis_client = redis.from_url(
    REDIS_URL,
    # returns normal python strings instead of bytes
    decode_responses=True
)