from fastapi import APIRouter, UploadFile, File, HTTPException
from services.audio_service import AudioService
from utils.file_utils import validate_file, save_upload

router = APIRouter()
service = AudioService()

ALLOWED_TYPES = [
    "audio/mpeg", "audio/mp3",
    "audio/wav", "audio/x-wav", "audio/wave",
    "audio/ogg", "audio/flac",
    "audio/mp4", "audio/x-m4a", "audio/aac",
    "audio/webm",
]


@router.post("/analyze-audio")
async def analyze_audio_v2(file: UploadFile = File(...)):
    """
    Primary voice-clone / synthetic speech detection endpoint.
    Runs MFCC, pitch, spectral, noise, reverb, compression, flux, ZCR analysis
    + Groq AI explanation.
    """
    validate_file(file, allowed_types=ALLOWED_TYPES)
    file_path = await save_upload(file, subfolder="audio")
    return await service.analyze(file_path, file.filename)


@router.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    """Legacy alias."""
    validate_file(file, allowed_types=ALLOWED_TYPES)
    file_path = await save_upload(file, subfolder="audio")
    return await service.analyze(file_path, file.filename)


@router.get("/history")
async def get_history():
    return await service.get_history()


@router.get("/history/{record_id}")
async def get_record(record_id: str):
    record = await service.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record
