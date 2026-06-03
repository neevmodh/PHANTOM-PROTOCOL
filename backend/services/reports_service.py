import csv
import json
import os
from datetime import datetime
from typing import Any

from config import settings
from services.analytics_service import AnalyticsService


class ReportsService:
    analytics = AnalyticsService()

    def _report_base(self, report_id: str) -> str:
        return os.path.join(settings.REPORTS_DIR, f"report_{report_id}")

    def _report_path(self, report_id: str, format: str) -> str:
        return f"{self._report_base(report_id)}.{format}"

    def _read_csv(self, filename: str) -> list[dict[str, Any]]:
        path = os.path.join(settings.CSV_DATA_DIR, filename)
        if not os.path.exists(path):
            return []
        with open(path, "r", newline="") as file:
            return list(csv.DictReader(file))

    def _all_records(self) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []
        for media_type, filename in self.analytics.CSV_FILES.items():
            for row in self._read_csv(filename):
                trust_score = self.analytics._safe_float(row.get("trust_score", 0))
                verdict = self.analytics._normalize_verdict(row.get("verdict"), trust_score)
                row["media_type"] = media_type
                row["trust_score"] = trust_score
                row["verdict"] = verdict
                records.append(row)
        records.sort(key=lambda row: row.get("timestamp", ""), reverse=True)
        return records

    def _find_record(self, record_id: str, media_type: str | None = None) -> dict[str, Any] | None:
        if media_type:
            rows = self._read_csv(self.analytics.CSV_FILES.get(media_type, ""))
            for row in rows:
                if row.get("id") == record_id:
                    return {**row, "media_type": media_type}
            return None

        for row in self._all_records():
            if row.get("id") == record_id:
                return row
        return None

    def _parse_json_field(self, value: Any, fallback: Any) -> Any:
        if isinstance(value, (dict, list)):
            return value
        if not value:
            return fallback
        try:
            return json.loads(value)
        except Exception:
            return fallback

    def _build_report(self, record: dict[str, Any], media_type: str | None = None) -> dict[str, Any]:
        forensic_findings = self._parse_json_field(
            record.get("forensic_findings") or record.get("forensic_indicators") or record.get("forensic_reasons"),
            [],
        )
        explanation_report = self._parse_json_field(record.get("explanation_report"), {})

        analyzed_at = record.get("timestamp") or datetime.utcnow().isoformat()
        trust_score = self.analytics._safe_float(record.get("trust_score", 0))
        confidence = self.analytics._safe_float(record.get("confidence", record.get("confidence_score", 0)))
        verdict = self.analytics._normalize_verdict(record.get("verdict"), trust_score)

        analysis_summary = {
            "verdict": verdict,
            "trust_score": round(trust_score, 1),
            "confidence": round(confidence, 1),
            "risk_level": explanation_report.get("severity_assessment", {}).get("level") or verdict,
            "media_type": media_type or record.get("media_type") or "unknown",
            "timestamp": analyzed_at,
        }

        return {
            "report_id": record.get("id"),
            "record_id": record.get("id"),
            "media_type": media_type or record.get("media_type"),
            "filename": record.get("filename") or record.get("url") or record.get("file_path") or "unknown",
            "generated_at": datetime.utcnow().isoformat(),
            "analysis_timestamp": analyzed_at,
            "verdict": verdict,
            "trust_score": round(trust_score, 1),
            "confidence": round(confidence, 1),
            "forensic_findings": forensic_findings,
            "explanation": record.get("explanation") or explanation_report.get("human_readable_explanation") or "",
            "analysis_summary": analysis_summary,
            "explanation_report": explanation_report,
            "source_record": record,
        }

    def _write_json_report(self, report_id: str, report: dict[str, Any]) -> str:
        path = self._report_path(report_id, "json")
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
        with open(path, "w", encoding="utf-8") as file:
            json.dump(report, file, indent=2, ensure_ascii=False)
        return path

    def _escape_pdf_text(self, text: str) -> str:
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    def _pdf_lines(self, report: dict[str, Any]) -> list[str]:
        explanation = report.get("explanation") or ""
        findings = report.get("forensic_findings") or []
        summary = report.get("analysis_summary") or {}

        lines = [
            "ISAFE Forensic Report",
            f"Report ID: {report.get('report_id')}",
            f"Filename: {report.get('filename')}",
            f"Media Type: {report.get('media_type')}",
            f"Verdict: {report.get('verdict')} | Trust Score: {report.get('trust_score')}/100 | Confidence: {report.get('confidence')}/100",
            f"Analyzed At: {report.get('analysis_timestamp')}",
            f"Generated At: {report.get('generated_at')}",
            f"Analysis Summary: {summary.get('risk_level', 'unknown')} risk assessment for {summary.get('media_type', 'unknown')} content.",
            "",
            "Forensic Findings:",
        ]

        if findings:
            for finding in findings[:8]:
                if isinstance(finding, dict):
                    lines.append(
                        f"- [{str(finding.get('severity', 'medium')).upper()}] {finding.get('indicator') or finding.get('title')}: {finding.get('detail', '')}"
                    )
                else:
                    lines.append(f"- {finding}")
        else:
            lines.append("- No significant anomalies detected.")

        lines.extend([
            "",
            "Explanation:",
            explanation or "No explanation available.",
        ])
        return lines

    def _build_pdf(self, report: dict[str, Any]) -> bytes:
        lines = self._pdf_lines(report)
        content_lines = []
        content_lines.append("BT /F1 12 Tf 72 760 Td")
        first = True
        for line in lines:
            safe_line = self._escape_pdf_text(str(line))
            if first:
                content_lines.append(f"({safe_line}) Tj")
                first = False
            else:
                content_lines.append("T*")
                content_lines.append(f"({safe_line}) Tj")
        content_lines.append("ET")
        content = "\n".join(content_lines).encode("latin-1", errors="ignore")

        objects: list[bytes] = []
        objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
        objects.append(b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n")
        objects.append(
            b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n"
        )
        objects.append(b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n")
        objects.append(
            f"5 0 obj << /Length {len(content)} >> stream\n".encode("latin-1") + content + b"\nendstream endobj\n"
        )

        pdf = bytearray()
        pdf.extend(b"%PDF-1.4\n")
        offsets = [0]
        for obj in objects:
            offsets.append(len(pdf))
            pdf.extend(obj)
        xref_start = len(pdf)
        pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
        pdf.extend(b"0000000000 65535 f \n")
        for offset in offsets[1:]:
            pdf.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))
        pdf.extend(
            (
                "trailer << /Size {size} /Root 1 0 R >>\n"
                "startxref\n{start}\n%%EOF\n"
            ).format(size=len(objects) + 1, start=xref_start).encode("latin-1")
        )
        return bytes(pdf)

    def _write_pdf_report(self, report_id: str, report: dict[str, Any]) -> str:
        path = self._report_path(report_id, "pdf")
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
        with open(path, "wb") as file:
            file.write(self._build_pdf(report))
        return path

    async def list_reports(self) -> list[dict[str, Any]]:
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
        grouped: dict[str, dict[str, Any]] = {}
        for filename in os.listdir(settings.REPORTS_DIR):
            if not filename.startswith("report_"):
                continue
            base, ext = os.path.splitext(filename)
            report_id = base.replace("report_", "")
            item = grouped.setdefault(report_id, {"report_id": report_id, "formats": [], "generated_at": None, "size_bytes": 0})
            item["formats"].append(ext.lstrip("."))
            path = os.path.join(settings.REPORTS_DIR, filename)
            item["size_bytes"] += os.path.getsize(path)
            mtime = datetime.utcfromtimestamp(os.path.getmtime(path)).isoformat()
            item["generated_at"] = max(item["generated_at"] or mtime, mtime)
        return sorted(grouped.values(), key=lambda item: item["generated_at"] or "", reverse=True)

    async def generate_report(self, record_id: str, media_type: str, formats: list[str] | None = None) -> dict[str, Any] | None:
        record = self._find_record(record_id, media_type)
        if not record:
            return None

        report = self._build_report(record, media_type)
        requested_formats = formats or ["json", "pdf"]
        generated_paths: dict[str, str] = {}

        if "json" in requested_formats:
            generated_paths["json"] = self._write_json_report(record_id, report)
        if "pdf" in requested_formats:
            generated_paths["pdf"] = self._write_pdf_report(record_id, report)

        return {
            "report_id": record_id,
            "formats": list(generated_paths.keys()),
            "paths": generated_paths,
            "status": "generated",
            "report": report,
        }

    async def get_report_path(self, report_id: str, format: str = "pdf") -> str | None:
        path = self._report_path(report_id, format)
        return path if os.path.exists(path) else None

    async def get_report(self, report_id: str, format: str = "json") -> dict[str, Any] | None:
        path = self._report_path(report_id, format)
        if not os.path.exists(path):
            return None
        if format == "json":
            with open(path, "r", encoding="utf-8") as file:
                return json.load(file)
        return {"report_id": report_id, "format": format, "path": path}