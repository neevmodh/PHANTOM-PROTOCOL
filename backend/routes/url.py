from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.url_service import URLService

router = APIRouter()
service = URLService()


class URLRequest(BaseModel):
    url: str


@router.post("/analyze-url")
async def analyze_url(request: URLRequest):
    """Analyze a URL for phishing, malicious, or synthetic content."""
    result = await service.analyze(request.url)
    return result


@router.post("/analyze")
async def analyze_url_legacy(request: URLRequest):
    """Backward-compatible alias for older clients."""
    result = await service.analyze(request.url)
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
