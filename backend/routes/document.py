from fastapi import APIRouter, UploadFile, File, HTTPException
from services.document_service import DocumentService
from utils.file_utils import validate_file, save_upload

router = APIRouter()
service = DocumentService()


@router.post("/analyze-document")
async def analyze_document(file: UploadFile = File(...)):
    """Analyze a document for AI-generated or tampered content."""
    validate_file(
        file,
        allowed_types=[
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
        ],
    )
    file_path = await save_upload(file, subfolder="documents")
    result = await service.analyze(file_path, file.filename)
    return result


@router.post("/analyze")
async def analyze_document_legacy(file: UploadFile = File(...)):
    """Backward-compatible alias for older clients."""
    validate_file(
        file,
        allowed_types=[
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
        ],
    )
    file_path = await save_upload(file, subfolder="documents")
    result = await service.analyze(file_path, file.filename)
    return result


@router.get("/history")
async def get_history():
    return await service.get_history()


@router.get("/history/{record_id}")
async def get_record(record_id: str):
    record = await service.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record
