import boto3
from botocore.exceptions import ClientError

from config import R2_ACCESS_KEY, R2_ACCOUNT_ID, R2_SECRET_KEY, R2_BUCKET_NAME

R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

_client = None


def get_r2_client():
    global _client
    if _client is None:
        _client = boto3.client(
            service_name="s3",
            endpoint_url=R2_ENDPOINT_URL,
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            region_name="auto",
        )
    return _client


def upload_bytes(object_key: str, data: bytes) -> None:
    client = get_r2_client()
    client.put_object(Bucket=R2_BUCKET_NAME, Key=object_key, Body=data)


def download_bytes(object_key: str) -> bytes:
    client = get_r2_client()
    response = client.get_object(Bucket=R2_BUCKET_NAME, Key=object_key)
    return response["Body"].read()


def delete_object(object_key: str) -> None:
    client = get_r2_client()
    client.delete_object(Bucket=R2_BUCKET_NAME, Key=object_key)


def object_exists(object_key: str) -> bool:
    client = get_r2_client()
    try:
        client.head_object(Bucket=R2_BUCKET_NAME, Key=object_key)
        return True
    except ClientError:
        return False
