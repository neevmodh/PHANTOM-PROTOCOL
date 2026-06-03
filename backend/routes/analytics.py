from fastapi import APIRouter
from services.analytics_service import AnalyticsService

router = APIRouter()
service = AnalyticsService()


@router.get("/summary")
async def get_summary():
    """Get overall detection summary statistics."""
    return await service.get_summary()


@router.get("/dashboard")
async def get_dashboard():
    """Get the full dashboard payload used by the analytics page."""
    return await service.get_dashboard()


@router.get("/trends")
async def get_trends():
    """Get detection trends over time."""
    return await service.get_trends()


@router.get("/breakdown")
async def get_breakdown():
    """Get breakdown by media type."""
    return await service.get_breakdown()


@router.get("/risk-distribution")
async def get_risk_distribution():
    """Get trust-score risk distribution buckets."""
    return await service.get_risk_distribution()


@router.get("/content-types")
async def get_content_types():
    """Get content type analysis including average trust score and flag rate."""
    return await service.get_content_types()


@router.get("/activity")
async def get_activity(days: int = 14):
    """Get a recent activity timeline."""
    return await service.get_activity_timeline(days)


@router.get("/recent")
async def get_recent(limit: int = 10):
    """Get most recent detections across all types."""
    return await service.get_recent(limit)
