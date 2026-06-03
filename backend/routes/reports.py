from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from services.reports_service import ReportsService

router = APIRouter()
service = ReportsService()


@router.get("/")
async def list_reports():
    """List all generated reports."""
    return await service.list_reports()


@router.post("/generate/{record_id}")
async def generate_report(record_id: str, media_type: str = "image"):
    """Generate a forensic report for a specific detection record."""
    result = await service.generate_report(record_id, media_type)
    if not result:
        raise HTTPException(status_code=404, detail="Record not found")
    return result


@router.get("/download/{report_id}")
async def download_report(report_id: str, format: str = Query("pdf", pattern="^(pdf|json)$")):
    """Download a generated report."""
    path = await service.get_report_path(report_id, format)
    if not path:
        raise HTTPException(status_code=404, detail="Report not found")
    media_type = "application/pdf" if format == "pdf" else "application/json"
    return FileResponse(path, media_type=media_type, filename=f"isafe_report_{report_id}.{format}")
