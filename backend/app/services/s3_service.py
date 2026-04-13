import os
import uuid
import shutil
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

from app.config import settings

# Local storage fallback for development (no AWS credentials needed)
LOCAL_STORAGE_DIR = Path(os.environ.get("UPLOAD_DIR", "./data/uploads"))


def _use_local_storage() -> bool:
    """Use local filesystem if no AWS credentials are configured."""
    return not settings.aws_access_key_id or settings.aws_access_key_id == "your-key"


def _get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
    )


def upload_file(file_bytes: bytes, user_id: str, filename: str) -> str:
    """
    Upload file to S3 (or local storage in dev).
    Returns the storage key.
    """
    key = f"documents/{user_id}/{uuid.uuid4()}_{filename}"

    if _use_local_storage():
        path = LOCAL_STORAGE_DIR / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(file_bytes)
    else:
        client = _get_s3_client()
        client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=key,
            Body=file_bytes,
            ContentType="application/pdf",
        )

    return key


def download_to_temp(s3_key: str) -> str:
    """
    Download file to a temp location. Returns the temp file path.
    """
    temp_dir = Path("./data/temp")
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_path = temp_dir / f"{uuid.uuid4()}.pdf"

    if _use_local_storage():
        source = LOCAL_STORAGE_DIR / s3_key
        shutil.copy2(source, temp_path)
    else:
        client = _get_s3_client()
        client.download_file(settings.s3_bucket_name, s3_key, str(temp_path))

    return str(temp_path)


def delete_file(s3_key: str) -> None:
    """Delete file from S3 or local storage."""
    if _use_local_storage():
        path = LOCAL_STORAGE_DIR / s3_key
        if path.exists():
            path.unlink()
    else:
        client = _get_s3_client()
        try:
            client.delete_object(Bucket=settings.s3_bucket_name, Key=s3_key)
        except ClientError:
            pass  # File may already be deleted
