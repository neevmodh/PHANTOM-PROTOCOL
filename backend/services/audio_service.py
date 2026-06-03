"""
Audio voice-clone / synthetic speech detection service.
Runs full acoustic forensic pipeline, persists to CSV, generates AI explanation.
"""

import time
from services.base_service import BaseService
from utils.audio_forensics import run_audio_analysis
from utils.groq_explainer import generate_audio_explanation
from config import settings


class AudioService(BaseService):
    csv_filename = "audio_detections.csv"
    csv_fields = [
        "id", "filename", "file_path", "timestamp",
        "trust_score", "verdict", "confidence", "flag_count",
        "duration_seconds", "sample_rate", "voice_clone_probability",
        # raw metrics
        "mfcc_delta_mean", "mfcc_cv",
        "centroid_cv", "bandwidth_cv",
        "pitch_cv", "pitch_mean", "voiced_ratio",
        "snr_db", "noise_cv",
        "decay_rate", "high_freq_ratio",
        "flux_cv", "zcr_cv",
        "model_used", "processing_time_ms", "explanation",
    ]

    async def analyze(self, file_path: str, filename: str) -> dict:
        t0 = time.perf_counter()

        forensics = run_audio_analysis(file_path)

        explanation = generate_audio_explanation(
            filename=filename or "unknown",
            verdict=forensics["verdict"],
            confidence=forensics["confidence"],
            trust_score=forensics["trust_score"],
            duration=forensics["duration_seconds"],
            voice_clone_prob=forensics["voice_clone_probability"],
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
            "duration_seconds": forensics["duration_seconds"],
            "sample_rate": forensics["sample_rate"],
            "voice_clone_probability": forensics["voice_clone_probability"],
            "mfcc_delta_mean": raw["mfcc_delta_mean"],
            "mfcc_cv": raw["mfcc_cv"],
            "centroid_cv": raw["centroid_cv"],
            "bandwidth_cv": raw["bandwidth_cv"],
            "pitch_cv": raw["pitch_cv"],
            "pitch_mean": raw["pitch_mean"],
            "voiced_ratio": raw["voiced_ratio"],
            "snr_db": raw["snr_db"],
            "noise_cv": raw["noise_cv"],
            "decay_rate": raw["decay_rate"],
            "high_freq_ratio": raw["high_freq_ratio"],
            "flux_cv": raw["flux_cv"],
            "zcr_cv": raw["zcr_cv"],
            "model_used": "ISAFE-AudioForensics-v1",
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
            "voice_clone_probability": forensics["voice_clone_probability"],
            "flag_count": forensics["flag_count"],
            "duration_seconds": forensics["duration_seconds"],
            "sample_rate": forensics["sample_rate"],
            "forensic_findings": forensics["forensic_findings"],
            "spectrogram": forensics["spectrogram"],
            "waveform": forensics["waveform"],
            "pitch_series": forensics["pitch_series"],
            "flux_series": forensics["flux_series"],
            "rms_series": forensics["rms_series"],
            "explanation": explanation,
            "model_used": "ISAFE-AudioForensics-v1",
            "processing_time_ms": processing_ms,
            "timestamp": record["timestamp"],
        }
