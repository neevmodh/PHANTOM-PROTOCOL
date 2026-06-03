import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException
from config import settings


def validate_file(file: UploadFile, allowed_types: list[str]):
    """Validate file MIME type."""
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {allowed_types}",
        )


async def save_upload(file: UploadFile, subfolder: str = "") -> str:
    """Save an uploaded file and return its path."""
    dest_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(dest_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1]
    unique_name = f"{uuid.uuid4()}{ext}"
    dest_path = os.path.join(dest_dir, unique_name)
    async with aiofiles.open(dest_path, "wb") as out:
        content = await file.read()
        await out.write(content)
    return dest_path
