"""
Video deepfake / authenticity detection service.
Runs full frame-level + temporal forensic pipeline, persists to CSV, generates AI explanation.
"""

import json
import time
import os

from services.base_service import BaseService
from utils.video_forensics import run_video_analysis
from utils.groq_explainer import generate_video_explanation
from config import settings


class VideoService(BaseService):
    csv_filename = "video_detections.csv"
    csv_fields = [
        "id", "filename", "file_path", "timestamp",
        "trust_score", "verdict", "confidence", "flag_count",
        "frames_analyzed", "total_frames", "suspicious_frames",
        "duration_seconds", "fps",
        "ela_mean", "ela_std", "freq_mean", "light_mean", "comp_mean",
        "flow_cv", "flow_mean", "blink_cv", "mouth_cv", "head_cv",
        "model_used", "processing_time_ms", "explanation",
    ]

    async def analyze(self, file_path: str, filename: str) -> dict:
        """
        Full video forensic pipeline:
          1. Extract frames with OpenCV
          2. Per-frame: ELA, FFT, lighting, compression
          3. Temporal: optical flow, eye blink, lip-sync, head movement
          4. Aggregate verdict + trust score
          5. Generate Groq AI explanation
          6. Persist to CSV
          7. Return structured response
        """
        t0 = time.perf_counter()

        forensics = run_video_analysis(file_path)

        explanation = generate_video_explanation(
            filename=filename or "unknown",
            verdict=forensics["verdict"],
            confidence=forensics["confidence"],
            trust_score=forensics["trust_score"],
            frames_analyzed=forensics["frames_analyzed"],
            suspicious_frames=forensics["suspicious_frames"],
            duration=forensics["duration_seconds"],
            findings=forensics["forensic_findings"],
            groq_api_key=settings.GROQ_API_KEY,
        )

        processing_ms = round((time.perf_counter() - t0) * 1000)
        record_id = self._new_id()
        raw = forensics["raw"]

        record = {
            "id": record_id,
            "filename": filename or "unknown",
            "file_path": file_path,
            "timestamp": self._now(),
            "trust_score": forensics["trust_score"],
            "verdict": forensics["verdict"],
            "confidence": forensics["confidence"],
            "flag_count": forensics["flag_count"],
            "frames_analyzed": forensics["frames_analyzed"],
            "total_frames": forensics["total_frames"],
            "suspicious_frames": forensics["suspicious_frames"],
            "duration_seconds": forensics["duration_seconds"],
            "fps": forensics["fps"],
            "ela_mean": raw["ela_mean"],
            "ela_std": raw["ela_std"],
            "freq_mean": raw["freq_mean"],
            "light_mean": raw["light_mean"],
            "comp_mean": raw["comp_mean"],
            "flow_cv": raw["flow_cv"],
            "flow_mean": raw["flow_mean"],
            "blink_cv": raw["blink_cv"],
            "mouth_cv": raw["mouth_cv"],
            "head_cv": raw["head_cv"],
            "model_used": "ISAFE-VideoForensics-v1",
            "processing_time_ms": processing_ms,
            "explanation": explanation,
        }

        self._write_record(record)

        return {
            "id": record_id,
            "filename": filename,
            "verdict": forensics["verdict"],
            "confidence": forensics["confidence"],
            "trust_score": forensics["trust_score"],
            "flag_count": forensics["flag_count"],
            "frames_analyzed": forensics["frames_analyzed"],
            "total_frames": forensics["total_frames"],
            "suspicious_frames": forensics["suspicious_frames"],
            "duration_seconds": forensics["duration_seconds"],
            "fps": forensics["fps"],
            "forensic_findings": forensics["forensic_findings"],
            "saved_frames": forensics["saved_frames"],
            "frame_timeline": forensics["frame_timeline"],
            "explanation": explanation,
            "model_used": "ISAFE-VideoForensics-v1",
            "processing_time_ms": processing_ms,
            "timestamp": record["timestamp"],
        }
