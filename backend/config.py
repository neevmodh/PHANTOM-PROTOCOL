from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    APP_NAME: str = "ISAFE"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    UPLOAD_DIR: str = "uploads"
    CSV_DATA_DIR: str = "csv_data"
    REPORTS_DIR: str = "reports"
    HEATMAP_DIR: str = "uploads/heatmaps"
    VIDEO_FRAMES_DIR: str = "uploads/video_frames"
    MAX_UPLOAD_SIZE_MB: int = 50
    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"




settings = Settings()

# Convert configured relative paths into absolute backend paths so all modules
# can rely on stable, absolute directories regardless of the current working dir.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
settings.UPLOAD_DIR = os.path.join(BASE_DIR, settings.UPLOAD_DIR)
settings.CSV_DATA_DIR = os.path.join(BASE_DIR, settings.CSV_DATA_DIR)
settings.REPORTS_DIR = os.path.join(BASE_DIR, settings.REPORTS_DIR)
settings.HEATMAP_DIR = os.path.join(BASE_DIR, settings.HEATMAP_DIR)
settings.VIDEO_FRAMES_DIR = os.path.join(BASE_DIR, settings.VIDEO_FRAMES_DIR)
