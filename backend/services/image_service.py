"""
Image deepfake / authenticity detection service.
Runs forensic analysis, persists results to CSV, and generates AI explanation.
"""

import json
import time
import os
from services.base_service import BaseService
from utils.image_forensics import run_full_analysis
from utils.groq_explainer import generate_explanation
from config import settings


class ImageService(BaseService):
    csv_filename = "image_detections.csv"
    csv_fields = [
        "id", "filename", "file_path", "timestamp",
        "trust_score", "verdict", "confidence", "flag_count",
        "manipulation_regions", "heatmap_path",
        "model_used", "processing_time_ms",
        "ela_score", "ela_std", "noise_cv", "freq_peak_ratio",
        "ghost_score", "texture_cv", "lighting_angle_std", "compression_ratio",
        "explanation",
    ]

    async def analyze(self, file_path: str, filename: str) -> dict:
        """
        Full forensic pipeline:
          1. Run image forensics (ELA, noise, frequency, ghost, texture, lighting, compression)
          2. Generate Groq AI explanation
          3. Persist to CSV
          4. Return structured response
        """
        t0 = time.perf_counter()

        forensics = run_full_analysis(file_path)

        explanation = generate_explanation(
            filename=filename or "unknown",
            verdict=forensics["verdict"],
            confidence=forensics["confidence"],
            trust_score=forensics["trust_score"],
            findings=forensics["forensic_findings"],
            groq_api_key=settings.GROQ_API_KEY,
        )

        processing_ms = round((time.perf_counter() - t0) * 1000)

        # Build manipulation regions from findings for heatmap overlay
        regions = self._findings_to_regions(forensics["forensic_findings"])

        record_id = self._new_id()
        record = {
            "id": record_id,
            "filename": filename or "unknown",
            "file_path": file_path,
            "timestamp": self._now(),
            "trust_score": forensics["trust_score"],
            "verdict": forensics["verdict"],
            "confidence": forensics["confidence"],
            "flag_count": forensics["flag_count"],
            "manipulation_regions": json.dumps(regions),
            "heatmap_path": forensics["heatmap_path"],
            "model_used": "ISAFE-Forensics-v1",
            "processing_time_ms": processing_ms,
            # Raw metric columns
            "ela_score": forensics["raw"]["ela_score"],
            "ela_std": forensics["raw"]["ela_std"],
            "noise_cv": forensics["raw"]["noise_cv"],
            "freq_peak_ratio": forensics["raw"]["freq_peak_ratio"],
            "ghost_score": forensics["raw"]["ghost_score"],
            "texture_cv": forensics["raw"]["texture_cv"],
            "lighting_angle_std": forensics["raw"]["lighting_angle_std"],
            "compression_ratio": forensics["raw"]["compression_ratio"],
            "explanation": explanation,
        }

        self._write_record(record)

        # Build public URL for heatmap
        heatmap_url = self._heatmap_url(forensics["heatmap_path"])
        image_url = self._image_url(file_path)

        return {
            "id": record_id,
            "filename": filename,
            "verdict": forensics["verdict"],
            "confidence": forensics["confidence"],
            "trust_score": forensics["trust_score"],
            "flag_count": forensics["flag_count"],
            "forensic_findings": forensics["forensic_findings"],
            "heatmap_url": heatmap_url,
            "image_url": image_url,
            "explanation": explanation,
            "model_used": "ISAFE-Forensics-v1",
            "processing_time_ms": processing_ms,
            "timestamp": record["timestamp"],
        }

    # ── helpers ───────────────────────────────────────────────────────────────

    def _findings_to_regions(self, findings: list[dict]) -> list[dict]:
        """
        Convert forensic findings into approximate bounding-box regions
        for heatmap overlay. Positions are heuristic (real implementation
        would use segmentation masks).
        """
        positions = [
            {"x": 10, "y": 10, "w": 35, "h": 35},
            {"x": 55, "y": 10, "w": 35, "h": 35},
            {"x": 10, "y": 55, "w": 35, "h": 35},
            {"x": 55, "y": 55, "w": 35, "h": 35},
            {"x": 25, "y": 25, "w": 50, "h": 50},
        ]
        regions = []
        for i, finding in enumerate(findings[:5]):
            pos = positions[i % len(positions)]
            regions.append({**pos, "score": finding["score"], "label": finding["indicator"]})
        return regions

    def _heatmap_url(self, heatmap_path: str) -> str:
        if not heatmap_path:
            return ""
        # Convert local path to URL served by FastAPI static mount
        rel = os.path.relpath(heatmap_path, settings.UPLOAD_DIR)
        return f"/uploads/{rel.replace(os.sep, '/')}"

    def _image_url(self, file_path: str) -> str:
        if not file_path:
            return ""
        rel = os.path.relpath(file_path, settings.UPLOAD_DIR)
        return f"/uploads/{rel.replace(os.sep, '/')}"
