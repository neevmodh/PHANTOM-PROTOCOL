from fastapi import APIRouter, UploadFile, File, HTTPException
from services.video_service import VideoService
from utils.file_utils import validate_file, save_upload

router = APIRouter()
service = VideoService()

ALLOWED_TYPES = [
    "video/mp4",
    "video/avi",
    "video/x-msvideo",
    "video/quicktime",
    "video/mov",
    "video/webm",
    "video/x-matroska",
]


@router.post("/analyze-video")
async def analyze_video_v2(file: UploadFile = File(...)):
    """
    Primary video deepfake detection endpoint.
    Extracts frames, runs per-frame + temporal forensic analysis,
    generates Groq AI explanation.

    Returns:
        verdict, confidence, trust_score, forensic_findings,
        saved_frames, frame_timeline, explanation, processing_time_ms
    """
    validate_file(file, allowed_types=ALLOWED_TYPES)
    file_path = await save_upload(file, subfolder="videos")
    result = await service.analyze(file_path, file.filename)
    return result


@router.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    """Legacy alias — delegates to the same pipeline."""
    validate_file(file, allowed_types=ALLOWED_TYPES)
    file_path = await save_upload(file, subfolder="videos")
    result = await service.analyze(file_path, file.filename)
    return result


@router.get("/history")
async def get_history():
    """Retrieve video analysis history."""
    return await service.get_history()


@router.get("/history/{record_id}")
async def get_record(record_id: str):
    """Retrieve a specific video analysis record."""
    record = await service.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record
