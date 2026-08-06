import boto3
from botocore.exceptions import ClientError

from config import (
    R2_ACCESS_KEY,
    R2_ACCOUNT_ID,
    R2_SECRET_KEY,
    R2_BUCKET
)

r2_client = boto3.client(
    service_name='s3',
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name='auto',
)

def upload_bytes(object_key: str, data: bytes) -> None:
    r2_client.put_object(Bucket=R2_BUCKET, Key=object_key, Body=data)
    
def download_bytes(object_key: str) -> bytes:
    response = r2_client.get_object(Bucket=R2_BUCKET, Key=object_key)
    return response["Body"].read()

def delete_object(object_key: str) -> None:
    r2_client.delete_object(Bucket=R2_BUCKET, Key=object_key)

def object_exists(object_key: str) -> bool:
    try:
        r2_client.head_object(Bucket=R2_BUCKET, Key=object_key)
        return True
    except ClientError:
        return False