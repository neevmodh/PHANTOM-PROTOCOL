import io
import json
import os
import re
import statistics
import time
import zipfile
from collections import Counter
from datetime import datetime
from typing import Any
from xml.etree import ElementTree

import pdfplumber
import pytesseract
from PIL import Image

from services.explanation_service import ExplanationService
from services.base_service import BaseService


class DocumentService(BaseService):
    csv_filename = "document_detections.csv"
    csv_fields = [
        "id",
        "filename",
        "file_path",
        "timestamp",
        "trust_score",
        "verdict",
        "confidence",
        "ai_generated_probability",
        "ocr_consistency",
        "metadata_mismatch",
        "formatting_anomalies",
        "semantic_consistency",
        "suspicious_structure",
        "forensic_indicators",
        "explanation",
        "model_used",
        "processing_time_ms",
    ]

    def __init__(self):
        self.explanation_service = ExplanationService()

    async def analyze(self, file_path: str, filename: str) -> dict[str, Any]:
        started_at = time.perf_counter()
        extension = os.path.splitext(filename.lower())[1]
        text, metadata = self._extract_document(file_path, extension)
        indicators: list[dict[str, Any]] = []

        ocr_consistency = self._ocr_consistency(file_path, extension, text)
        metadata_mismatch = self._metadata_mismatch(metadata, filename, text)
        formatting_anomalies = self._formatting_anomalies(text)
        semantic_consistency = self._semantic_consistency(text)
        suspicious_structure = self._suspicious_structure(text)
        ai_generated_probability = self._ai_probability(
            text=text,
            ocr_consistency=ocr_consistency,
            metadata_mismatch=metadata_mismatch,
            formatting_anomalies=formatting_anomalies,
            semantic_consistency=semantic_consistency,
            suspicious_structure=suspicious_structure,
        )

        if ocr_consistency < 0.7:
            indicators.append(self._finding("OCR consistency", "high", f"OCR alignment is weak at {round(ocr_consistency * 100)}%.", 18))
        if metadata_mismatch["score"] > 0:
            indicators.append(self._finding("Metadata mismatch", "medium" if metadata_mismatch["score"] < 0.5 else "high", metadata_mismatch["detail"], 8 + int(metadata_mismatch["score"] * 12)))
        if formatting_anomalies["score"] > 0:
            indicators.append(self._finding("Formatting anomalies", "medium" if formatting_anomalies["score"] < 0.5 else "high", formatting_anomalies["detail"], 8 + int(formatting_anomalies["score"] * 10)))
        if semantic_consistency < 0.72:
            indicators.append(self._finding("Semantic consistency", "medium", f"The narrative coherence score is {round(semantic_consistency * 100)}%.", 10))
        if suspicious_structure["score"] > 0:
            indicators.append(self._finding("Suspicious structure", "high", suspicious_structure["detail"], 10 + int(suspicious_structure["score"] * 12)))

        trust_penalty = (
            (1 - ocr_consistency) * 24
            + metadata_mismatch["score"] * 16
            + formatting_anomalies["score"] * 14
            + (1 - semantic_consistency) * 18
            + suspicious_structure["score"] * 16
            + ai_generated_probability * 20
        )
        trust_score = max(0, min(100, round(100 - trust_penalty)))
        confidence = max(
            30,
            min(99, round(45 + (1 - abs(0.5 - ai_generated_probability)) * 20 + ocr_consistency * 15 + semantic_consistency * 10)),
        )
        verdict = self._verdict(trust_score, ai_generated_probability)
        metadata_anomalies = [metadata_mismatch["detail"]] if metadata_mismatch["score"] > 0 else []
        spectral_anomalies = [
            f"Formatting anomaly score {round(formatting_anomalies['score'] * 100)}%",
            f"Semantic consistency {round(semantic_consistency * 100)}%",
        ]
        phishing_indicators: list[str] = []
        manipulation_signals = [suspicious_structure["detail"]] if suspicious_structure["score"] > 0 else []
        explanation_report = self.explanation_service.explain_forensic_report(
            subject=filename,
            confidence_score=confidence,
            trust_score=trust_score,
            forensic_indicators=indicators,
            metadata_anomalies=metadata_anomalies,
            spectral_anomalies=spectral_anomalies,
            phishing_indicators=phishing_indicators,
            manipulation_signals=manipulation_signals,
            context_type="document",
        )
        explanation = explanation_report["human_readable_explanation"]

        processing_time_ms = int((time.perf_counter() - started_at) * 1000)
        record = {
            "id": self._new_id(),
            "filename": filename,
            "file_path": file_path,
            "timestamp": self._now(),
            "trust_score": trust_score,
            "verdict": verdict,
            "confidence": confidence,
            "ai_generated_probability": round(ai_generated_probability, 4),
            "ocr_consistency": round(ocr_consistency, 4),
            "metadata_mismatch": round(metadata_mismatch["score"], 4),
            "formatting_anomalies": round(formatting_anomalies["score"], 4),
            "semantic_consistency": round(semantic_consistency, 4),
            "suspicious_structure": round(suspicious_structure["score"], 4),
            "forensic_indicators": json.dumps(indicators, ensure_ascii=False),
            "explanation_report": json.dumps(explanation_report, ensure_ascii=False),
            "explanation": explanation,
            "model_used": "ISAFE-DocForensics-v1",
            "processing_time_ms": processing_time_ms,
        }
        self._write_record(record)

        return {
            **record,
            "forensic_indicators": indicators,
            "explanation_report": explanation_report,
            "metadata": metadata,
            "preview_text": text[:1200],
            "document_type": self._document_type(extension),
            "ai_generated_probability": round(ai_generated_probability, 4),
            "ocr_consistency": round(ocr_consistency, 4),
            "metadata_mismatch": metadata_mismatch,
            "formatting_anomalies": formatting_anomalies,
            "semantic_consistency": round(semantic_consistency, 4),
            "suspicious_structure": suspicious_structure,
            "trust_score": trust_score,
            "confidence": confidence,
            "verdict": verdict,
            "processing_time_ms": processing_time_ms,
        }

    def _extract_document(self, file_path: str, extension: str) -> tuple[str, dict[str, Any]]:
        if extension == ".pdf":
            return self._extract_pdf(file_path)
        if extension == ".docx":
            return self._extract_docx(file_path)
        return self._extract_txt(file_path)

    def _extract_pdf(self, file_path: str) -> tuple[str, dict[str, Any]]:
        text_parts: list[str] = []
        metadata: dict[str, Any] = {}
        with pdfplumber.open(file_path) as pdf:
            metadata = dict(pdf.metadata or {})
            for page in pdf.pages[:12]:
                page_text = page.extract_text() or ""
                if page_text.strip():
                  text_parts.append(page_text)
                else:
                    try:
                        image = page.to_image(resolution=150).original
                        ocr_text = pytesseract.image_to_string(image)
                        if ocr_text.strip():
                            text_parts.append(ocr_text)
                    except Exception:
                        continue
        return "\n".join(text_parts).strip(), metadata

    def _extract_docx(self, file_path: str) -> tuple[str, dict[str, Any]]:
        namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        text_parts: list[str] = []
        metadata: dict[str, Any] = {}
        with zipfile.ZipFile(file_path) as archive:
            if "docProps/core.xml" in archive.namelist():
                core_xml = ElementTree.fromstring(archive.read("docProps/core.xml"))
                for child in core_xml:
                    key = child.tag.split("}")[-1]
                    metadata[key] = (child.text or "").strip()
            if "word/document.xml" in archive.namelist():
                document_xml = ElementTree.fromstring(archive.read("word/document.xml"))
                for node in document_xml.findall(".//w:t", namespace):
                    if node.text:
                        text_parts.append(node.text)
        return " ".join(text_parts).strip(), metadata

    def _extract_txt(self, file_path: str) -> tuple[str, dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as file:
            return file.read(), {}

    def _ocr_consistency(self, file_path: str, extension: str, text: str) -> float:
        if extension not in {".pdf", ".docx", ".txt"}:
            return 0.5

        if extension == ".txt":
            return 0.94 if text.strip() else 0.42

        if extension == ".docx":
            return 0.84 if len(text.split()) > 40 else 0.62

        try:
            with pdfplumber.open(file_path) as pdf:
                if not pdf.pages:
                    return 0.2
                sample_page = pdf.pages[0]
                extracted = (sample_page.extract_text() or "").strip()
                if not extracted:
                    try:
                        image = sample_page.to_image(resolution=150).original
                        ocr_text = pytesseract.image_to_string(image).strip()
                        return 0.9 if ocr_text else 0.35
                    except Exception:
                        return 0.4
                try:
                    image = sample_page.to_image(resolution=150).original
                    ocr_text = pytesseract.image_to_string(image).strip()
                except Exception:
                    return 0.76
                return self._text_overlap_score(extracted, ocr_text)
        except Exception:
            return 0.45

    def _metadata_mismatch(self, metadata: dict[str, Any], filename: str, text: str) -> dict[str, Any]:
        flags: list[str] = []
        score = 0.0
        lowered_name = filename.lower()
        author = str(metadata.get("Author") or metadata.get("creator") or metadata.get("creator-name") or "").lower()
        title = str(metadata.get("Title") or metadata.get("title") or "").lower()

        if author and any(token in author for token in ["unknown", "microsoft", "word", "libreoffice"]):
            score += 0.35
            flags.append("document author metadata is generic or template-like")
        if title and lowered_name and title and lowered_name.replace(".pdf", "") not in title and lowered_name.replace(".docx", "") not in title:
            score += 0.25
            flags.append("document title does not match the filename")
        if "created" in metadata or "modified" in metadata:
            created = str(metadata.get("Created") or metadata.get("created") or "")
            modified = str(metadata.get("Modified") or metadata.get("modified") or "")
            if created and modified and created > modified:
                score += 0.25
                flags.append("metadata timestamps are out of order")
        if text and len(text.split()) > 200 and not metadata:
            score += 0.2
            flags.append("rich document text exists without usable metadata")

        return {"score": min(score, 1.0), "detail": "; ".join(flags) if flags else "No strong metadata mismatch detected."}

    def _formatting_anomalies(self, text: str) -> dict[str, Any]:
        if not text.strip():
            return {"score": 0.0, "detail": "No text content detected."}

        anomalies: list[str] = []
        score = 0.0
        lines = [line for line in text.splitlines() if line.strip()]
        long_lines = [line for line in lines if len(line) > 240]
        repeated_runs = re.findall(r"(.)\1{6,}", text)
        bullet_density = sum(1 for line in lines if re.match(r"^\s*[-*•\d]+[.)]?\s+", line)) / max(len(lines), 1)
        uppercase_ratio = sum(1 for ch in text if ch.isupper()) / max(sum(1 for ch in text if ch.isalpha()), 1)

        if long_lines:
            score += 0.25
            anomalies.append("contains unusually long text lines")
        if repeated_runs:
            score += 0.25
            anomalies.append("contains repeated character runs that suggest templated or generated output")
        if bullet_density > 0.35:
            score += 0.18
            anomalies.append("uses a dense bullet or outline pattern")
        if uppercase_ratio > 0.22:
            score += 0.18
            anomalies.append("shows excessive uppercase usage")

        return {"score": min(score, 1.0), "detail": "; ".join(anomalies) if anomalies else "No notable formatting anomaly detected."}

    def _semantic_consistency(self, text: str) -> float:
        sentences = [sentence.strip() for sentence in re.split(r"[.!?]+", text) if sentence.strip()]
        words = re.findall(r"\b\w+\b", text.lower())
        if len(sentences) < 2 or len(words) < 40:
            return 0.58 if text.strip() else 0.2

        sentence_lengths = [len(re.findall(r"\b\w+\b", sentence)) for sentence in sentences]
        variation = statistics.pstdev(sentence_lengths) if len(sentence_lengths) > 1 else 0.0
        unique_ratio = len(set(words)) / max(len(words), 1)
        redundancy = 1 - unique_ratio
        coherence = 1 - min(0.45, variation / 30) - min(0.25, redundancy * 0.6)
        return max(0.25, min(0.98, coherence))

    def _suspicious_structure(self, text: str) -> dict[str, Any]:
        if not text.strip():
            return {"score": 0.0, "detail": "No structural signal available."}

        score = 0.0
        flags: list[str] = []
        paragraphs = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
        if len(paragraphs) <= 2 and len(text.split()) > 150:
            score += 0.25
            flags.append("document has an unusually flat paragraph structure")
        if re.search(r"\b(lorem ipsum|insert generic text|placeholder)\b", text, re.I):
            score += 0.3
            flags.append("contains placeholder language")
        if len(re.findall(r"\b(?:figure|table|appendix|section)\b", text, re.I)) == 0 and len(text.split()) > 300:
            score += 0.15
            flags.append("lacks section-style markers in a long document")
        if len(set(re.findall(r"\b\w{1,2}\b", text.lower()))) > 35:
            score += 0.15
            flags.append("contains many short tokens typical of copied fragments")

        return {"score": min(score, 1.0), "detail": "; ".join(flags) if flags else "No suspicious structural pattern detected."}

    def _ai_probability(self, **signals: Any) -> float:
        score = 0.12
        score += (1 - signals["ocr_consistency"]) * 0.24
        score += signals["metadata_mismatch"]["score"] * 0.15
        score += signals["formatting_anomalies"]["score"] * 0.18
        score += (1 - signals["semantic_consistency"]) * 0.18
        score += signals["suspicious_structure"]["score"] * 0.17

        text = str(signals.get("text") or "")
        if text:
            sentences = [sentence for sentence in re.split(r"[.!?]+", text) if sentence.strip()]
            if sentences:
                avg_len = sum(len(sentence.split()) for sentence in sentences) / len(sentences)
                if avg_len > 28:
                    score += 0.08
                if len({sentence.strip().lower() for sentence in sentences[:24]}) < max(3, len(sentences[:24]) // 3):
                    score += 0.07

        return max(0.03, min(0.97, score))

    def _text_overlap_score(self, first: str, second: str) -> float:
        first_tokens = set(re.findall(r"\b\w+\b", first.lower()))
        second_tokens = set(re.findall(r"\b\w+\b", second.lower()))
        if not first_tokens or not second_tokens:
            return 0.45
        overlap = len(first_tokens & second_tokens) / len(first_tokens | second_tokens)
        return max(0.25, min(0.98, 0.35 + overlap * 0.9))

    def _verdict(self, trust_score: int, ai_probability: float) -> str:
        if trust_score >= 75 and ai_probability < 0.38:
            return "real"
        if trust_score >= 50:
            return "uncertain"
        return "fake"

    def _document_type(self, extension: str) -> str:
        return {".pdf": "pdf", ".docx": "docx", ".txt": "txt"}.get(extension, "unknown")

    def _finding(self, indicator: str, severity: str, detail: str, score: int) -> dict[str, Any]:
        return {
            "indicator": indicator,
            "severity": severity,
            "detail": detail,
            "score": score,
        }
