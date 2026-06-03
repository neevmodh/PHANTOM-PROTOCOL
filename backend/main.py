from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from config import settings
from routes import image, video, audio, document, url, analytics, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure configured directories exist on startup (settings paths are absolute)
    paths = [
        settings.UPLOAD_DIR,
        settings.CSV_DATA_DIR,
        settings.REPORTS_DIR,
        settings.HEATMAP_DIR,
        os.path.join(settings.UPLOAD_DIR, "images"),
        os.path.join(settings.UPLOAD_DIR, "videos"),
        os.path.join(settings.UPLOAD_DIR, "audio"),
        settings.VIDEO_FRAMES_DIR,
    ]
    for directory in paths:
        os.makedirs(directory, exist_ok=True)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intelligent Synthetic Authenticity & Forensic Engine API",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Routers
app.include_router(image.router, prefix="/api/image", tags=["Image Detection"])
app.include_router(video.router, prefix="/api/video", tags=["Video Detection"])
app.include_router(audio.router, prefix="/api/audio", tags=["Audio Detection"])
app.include_router(document.router, prefix="/api/document", tags=["Document Detection"])
app.include_router(url.router, prefix="/api/url", tags=["URL Detection"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
