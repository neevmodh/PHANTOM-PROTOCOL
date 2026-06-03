import csv
import os
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

from config import settings


class AnalyticsService:
    CSV_FILES = {
        "image": "image_detections.csv",
        "video": "video_detections.csv",
        "audio": "audio_detections.csv",
        "document": "document_detections.csv",
        "url": "url_detections.csv",
    }

    def _read_csv(self, filename: str) -> list[dict[str, Any]]:
        path = os.path.join(settings.CSV_DATA_DIR, filename)
        if not os.path.exists(path):
            return []
        with open(path, "r", newline="") as f:
            return list(csv.DictReader(f))

    def _safe_float(self, value: Any, default: float = 0.0) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _safe_int(self, value: Any, default: int = 0) -> int:
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return default

    def _normalize_verdict(self, value: Any, trust_score: float | None = None) -> str:
        verdict = str(value or "").lower()
        if verdict in {"real", "fake", "uncertain", "pending"}:
            return verdict
        if trust_score is None:
            return "pending"
        if trust_score >= 70:
            return "real"
        if trust_score >= 40:
            return "uncertain"
        return "fake"

    def _parse_record(self, media_type: str, row: dict[str, Any]) -> dict[str, Any]:
        trust_score = self._safe_float(row.get("trust_score", 0))
        confidence = self._safe_float(row.get("confidence", row.get("confidence_score", 0)))
        timestamp = str(row.get("timestamp", ""))
        verdict = self._normalize_verdict(row.get("verdict"), trust_score)
        filename = row.get("filename") or row.get("url") or row.get("file_path") or "unknown"
        return {
            **row,
            "media_type": media_type,
            "filename": filename,
            "timestamp": timestamp,
            "trust_score": trust_score,
            "confidence": confidence,
            "verdict": verdict,
        }

    def _all_records(self) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []
        for media_type, filename in self.CSV_FILES.items():
            for row in self._read_csv(filename):
                records.append(self._parse_record(media_type, row))
        records.sort(key=lambda record: record.get("timestamp", ""), reverse=True)
        return records

    async def get_summary(self) -> dict:
        records = self._all_records()
        totals = {
            media_type: {
                "total": 0,
                "flagged": 0,
                "clean": 0,
                "pending": 0,
                "avg_trust_score": 0,
            }
            for media_type in self.CSV_FILES
        }

        trust_scores: list[float] = []
        confidence_scores: list[float] = []
        verdict_counts = {"real": 0, "fake": 0, "uncertain": 0, "pending": 0}

        for record in records:
            media_type = record["media_type"]
            trust_score = record["trust_score"]
            confidence = record["confidence"]
            verdict = record["verdict"]

            totals[media_type]["total"] += 1
            totals[media_type]["flagged"] += 1 if verdict == "fake" else 0
            totals[media_type]["clean"] += 1 if verdict == "real" else 0
            totals[media_type]["pending"] += 1 if verdict == "pending" else 0
            totals[media_type].setdefault("_trust_scores", []).append(trust_score)
            trust_scores.append(trust_score)
            confidence_scores.append(confidence)
            verdict_counts[verdict] = verdict_counts.get(verdict, 0) + 1

        for media_type, stats in totals.items():
            values = stats.pop("_trust_scores", [])
            stats["avg_trust_score"] = round(sum(values) / max(len(values), 1), 1) if values else 0.0

        total_analyses = len(records)
        avg_trust_score = round(sum(trust_scores) / max(len(trust_scores), 1), 1) if trust_scores else 0.0
        avg_confidence = round(sum(confidence_scores) / max(len(confidence_scores), 1), 1) if confidence_scores else 0.0
        flagged = verdict_counts["fake"]
        clean = verdict_counts["real"]
        pending = verdict_counts["pending"]

        latest_timestamp = records[0]["timestamp"] if records else None
        risk_distribution = self._risk_distribution(records)

        return {
            "totals": totals,
            "overall": {
                "total_analyses": total_analyses,
                "flagged": flagged,
                "clean": clean,
                "pending": pending,
                "avg_trust_score": avg_trust_score,
                "avg_confidence": avg_confidence,
                "latest_timestamp": latest_timestamp,
                "fake_rate": round((flagged / max(total_analyses, 1)) * 100, 1),
            },
            "verdict_counts": verdict_counts,
            "risk_distribution": risk_distribution,
        }

    async def get_trends(self) -> list:
        """Aggregate detections by date across all types."""
        records = self._all_records()
        daily: dict[str, dict[str, int]] = defaultdict(lambda: {"fake": 0, "real": 0, "pending": 0, "uncertain": 0})

        if not records:
            return []

        for record in records:
            date = str(record.get("timestamp", ""))[:10]
            verdict = record.get("verdict", "pending")
            if date:
                daily[date][verdict] = daily[date].get(verdict, 0) + 1

        all_dates = self._date_window(30)
        return [{"date": date, **daily.get(date, {"fake": 0, "real": 0, "pending": 0, "uncertain": 0})} for date in all_dates]

    async def get_breakdown(self) -> list:
        records = self._all_records()
        result = []
        for media_type in self.CSV_FILES:
            media_records = [record for record in records if record["media_type"] == media_type]
            result.append(
                {
                    "type": media_type,
                    "count": len(media_records),
                    "flagged": sum(1 for record in media_records if record["verdict"] == "fake"),
                    "avg_trust_score": round(sum(record["trust_score"] for record in media_records) / max(len(media_records), 1), 1) if media_records else 0.0,
                }
            )
        return result

    async def get_recent(self, limit: int = 10) -> list:
        records = self._all_records()
        return [self._serialize_recent(record) for record in records[:limit]]

    async def get_risk_distribution(self) -> list[dict[str, Any]]:
        return self._risk_distribution(self._all_records())

    async def get_content_types(self) -> list[dict[str, Any]]:
        records = self._all_records()
        content_types = []
        for media_type in self.CSV_FILES:
            media_records = [record for record in records if record["media_type"] == media_type]
            total = len(media_records)
            content_types.append(
                {
                    "type": media_type,
                    "count": total,
                    "flagged": sum(1 for record in media_records if record["verdict"] == "fake"),
                    "clean": sum(1 for record in media_records if record["verdict"] == "real"),
                    "avg_trust_score": round(sum(record["trust_score"] for record in media_records) / max(total, 1), 1) if media_records else 0.0,
                    "share": round((total / max(len(records), 1)) * 100, 1) if records else 0.0,
                }
            )
        return content_types

    async def get_activity_timeline(self, days: int = 14) -> list[dict[str, Any]]:
        records = self._all_records()
        if not records:
            return []
        window = self._date_window(days)
        counts = {date: 0 for date in window}
        for record in records:
            date = str(record.get("timestamp", ""))[:10]
            if date in counts:
                counts[date] += 1
        return [{"date": date, "scans": counts[date]} for date in window]

    async def get_dashboard(self) -> dict[str, Any]:
        return {
            "summary": await self.get_summary(),
            "trends": await self.get_trends(),
            "breakdown": await self.get_breakdown(),
            "risk_distribution": await self.get_risk_distribution(),
            "content_types": await self.get_content_types(),
            "recent": await self.get_recent(12),
            "activity_timeline": await self.get_activity_timeline(14),
        }

    def _risk_distribution(self, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        bins = [
            {"range": "0-19", "label": "Critical", "color": "#ff3366", "count": 0},
            {"range": "20-39", "label": "High", "color": "#ff7a59", "count": 0},
            {"range": "40-69", "label": "Medium", "color": "#ffcc00", "count": 0},
            {"range": "70-100", "label": "Low", "color": "#00ff88", "count": 0},
        ]
        for record in records:
            trust_score = record.get("trust_score", 0)
            if trust_score < 20:
                bins[0]["count"] += 1
            elif trust_score < 40:
                bins[1]["count"] += 1
            elif trust_score < 70:
                bins[2]["count"] += 1
            else:
                bins[3]["count"] += 1
        return bins

    def _serialize_recent(self, record: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": record.get("id"),
            "media_type": record.get("media_type"),
            "filename": record.get("filename"),
            "timestamp": record.get("timestamp"),
            "trust_score": record.get("trust_score"),
            "confidence": record.get("confidence"),
            "verdict": record.get("verdict"),
            "model_used": record.get("model_used", "unknown"),
            "processing_time_ms": self._safe_int(record.get("processing_time_ms", 0)),
        }

    def _date_window(self, days: int) -> list[str]:
        today = datetime.utcnow().date()
        return [(today - timedelta(days=offset)).isoformat() for offset in range(days - 1, -1, -1)]
