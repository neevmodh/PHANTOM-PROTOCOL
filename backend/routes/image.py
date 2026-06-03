from fastapi import APIRouter, UploadFile, File, HTTPException
from services.image_service import ImageService
from utils.file_utils import validate_file, save_upload

router = APIRouter()
service = ImageService()

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]


@router.post("/analyze-image")
async def analyze_image_v2(file: UploadFile = File(...)):
    """
    Primary deepfake / authenticity detection endpoint.
    Runs full forensic pipeline: ELA, noise, frequency, ghost, texture,
    lighting, compression analysis + Groq AI explanation.

    Returns:
        verdict, confidence, trust_score, forensic_findings,
        heatmap_url, image_url, explanation, processing_time_ms
    """
    validate_file(file, allowed_types=ALLOWED_TYPES)
    file_path = await save_upload(file, subfolder="images")
    result = await service.analyze(file_path, file.filename)
    return result


@router.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """Legacy alias — delegates to the same pipeline."""
    validate_file(file, allowed_types=ALLOWED_TYPES)
    file_path = await save_upload(file, subfolder="images")
    result = await service.analyze(file_path, file.filename)
    return result


@router.get("/history")
async def get_history():
    """Retrieve image analysis history."""
    return await service.get_history()


@router.get("/history/{record_id}")
async def get_record(record_id: str):
    """Retrieve a specific image analysis record."""
    record = await service.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record
