from pydantic import BaseModel

class UploadResponse(BaseModel):
    id: str
    short_code: str
    expires_at: int  # unix timestamp, so the frontend can show "expires in X hours"
