"""
URL Authenticity & Threat Intelligence Service
Integrates full forensic pipeline from url_forensics.py with live HTTP probing,
Groq AI explanation, and CSV persistence.
"""

import json
import time
from typing import Any
from urllib.parse import urlparse

import httpx

from services.base_service import BaseService
from services.explanation_service import ExplanationService
from utils.url_forensics import run_url_analysis


class URLService(BaseService):
    csv_filename = "url_detections.csv"
    csv_fields = [
        "id",
        "url",
        "timestamp",
        "risk_level",
        "trust_score",
        "confidence_score",
        "verdict",
        "ssl_valid",
        "https_valid",
        "redirect_count",
        "final_url",
        "domain_reputation",
        "ssl_validation",
        "threat_indicators",
        "forensic_reasons",
        "checks_summary",
        "domain_info",
        "explanation_report",
        "explanation",
        "processing_time_ms",
        "flag_count",
        "phishing_probability",
    ]

    def __init__(self):
        self.explanation_service = ExplanationService()

    async def analyze(self, url: str) -> dict[str, Any]:
        started_at = time.perf_counter()

        # ── 1. Static forensic analysis (all 12 checks) ──────────────────────
        forensics = run_url_analysis(url)
        normalized_url = forensics["url"]
        parsed = urlparse(normalized_url)

        # ── 2. Live HTTP probe ────────────────────────────────────────────────
        probe = await self._probe_url(normalized_url)
        redirect_count = probe["redirect_count"]
        final_url = probe["final_url"]
        final_scheme = probe["final_scheme"]
        ssl_live_valid = probe["ssl_valid"]

        # ── 3. Merge live probe into scores ───────────────────────────────────
        # Adjust trust score based on live probe results
        trust_score = float(forensics["trust_score"])
        confidence = float(forensics["confidence"])

        # Live SSL check can improve or worsen the static score
        if ssl_live_valid:
            trust_score = min(100.0, trust_score + 5)
            confidence = min(0.99, confidence + 0.04)
        elif parsed.scheme == "https" and not ssl_live_valid:
            # Claimed HTTPS but live probe failed
            trust_score = max(0.0, trust_score - 12)
            confidence = min(0.99, confidence + 0.06)

        # Excessive redirects penalty
        if redirect_count > 2:
            penalty = min(15, 4 + (redirect_count - 2) * 3)
            trust_score = max(0.0, trust_score - penalty)
            confidence = min(0.99, confidence + 0.04)

        trust_score = round(trust_score, 1)
        confidence_score = round(confidence * 100, 1)

        # ── 4. Derive risk level and verdict ──────────────────────────────────
        risk_level = self._risk_level(trust_score)
        verdict = self._verdict_from_risk(risk_level)

        # ── 5. Build SSL validation card ──────────────────────────────────────
        ssl_validation = {
            "input_scheme": parsed.scheme or "",
            "final_scheme": final_scheme,
            "redirect_count": redirect_count,
            "valid": ssl_live_valid and final_scheme == "https",
            "redirected_to_https": parsed.scheme != "https" and final_scheme == "https",
            "status": "Validated" if (ssl_live_valid and final_scheme == "https") else "At Risk",
        }

        # ── 6. Domain reputation card ─────────────────────────────────────────
        domain_info = forensics.get("domain_info", {})
        domain_reputation = self._build_domain_reputation(trust_score, domain_info)

        # ── 7. Threat indicators list ─────────────────────────────────────────
        forensic_reasons = forensics.get("forensic_findings", [])
        threat_indicators = [f["indicator"] for f in forensic_reasons]
        if redirect_count > 2:
            threat_indicators.append(f"Excessive redirects ({redirect_count})")
        if not ssl_live_valid and parsed.scheme == "https":
            threat_indicators.append("Live SSL handshake failed")

        # ── 8. AI explanation ─────────────────────────────────────────────────
        metadata_anomalies = [domain_reputation["signal"]] if domain_reputation.get("signal") else []
        spectral_anomalies = [f"Redirect chain length {redirect_count}"] if redirect_count > 0 else []
        phishing_indicators = [f["indicator"] for f in forensic_reasons if f["severity"] in ("high", "critical")]
        manipulation_signals = [f["indicator"] for f in forensic_reasons]

        explanation_report = self.explanation_service.explain_forensic_report(
            subject=normalized_url,
            confidence_score=confidence_score,
            trust_score=trust_score,
            forensic_indicators=forensic_reasons,
            metadata_anomalies=metadata_anomalies,
            spectral_anomalies=spectral_anomalies,
            phishing_indicators=phishing_indicators,
            manipulation_signals=manipulation_signals,
            context_type="url",
        )
        explanation = explanation_report["human_readable_explanation"]

        # ── 9. Persist to CSV ─────────────────────────────────────────────────
        processing_time_ms = int((time.perf_counter() - started_at) * 1000)
        record_id = self._new_id()

        record = {
            "id": record_id,
            "url": normalized_url,
            "timestamp": self._now(),
            "risk_level": risk_level,
            "trust_score": trust_score,
            "confidence_score": confidence_score,
            "verdict": verdict,
            "ssl_valid": ssl_validation["valid"],
            "https_valid": parsed.scheme == "https" or final_scheme == "https",
            "redirect_count": redirect_count,
            "final_url": final_url,
            "domain_reputation": json.dumps(domain_reputation, ensure_ascii=False),
            "ssl_validation": json.dumps(ssl_validation, ensure_ascii=False),
            "threat_indicators": json.dumps(threat_indicators, ensure_ascii=False),
            "forensic_reasons": json.dumps(forensic_reasons, ensure_ascii=False),
            "checks_summary": json.dumps(forensics.get("checks_summary", []), ensure_ascii=False),
            "domain_info": json.dumps(domain_info, ensure_ascii=False),
            "explanation_report": json.dumps(explanation_report, ensure_ascii=False),
            "explanation": explanation,
            "processing_time_ms": processing_time_ms,
            "flag_count": forensics.get("flag_count", len(forensic_reasons)),
            "phishing_probability": forensics.get("phishing_probability", round((100 - trust_score) / 100, 4)),
        }
        self._write_record(record)

        # ── 10. Return full response ──────────────────────────────────────────
        return {
            "id": record_id,
            "url": normalized_url,
            "timestamp": record["timestamp"],
            "risk_level": risk_level,
            "trust_score": trust_score,
            "confidence_score": confidence_score,
            "verdict": verdict,
            "ssl_valid": ssl_validation["valid"],
            "https_valid": record["https_valid"],
            "redirect_count": redirect_count,
            "final_url": final_url,
            "domain_reputation": domain_reputation,
            "ssl_validation": ssl_validation,
            "threat_indicators": threat_indicators,
            "forensic_reasons": forensic_reasons,
            "checks_summary": forensics.get("checks_summary", []),
            "domain_info": domain_info,
            "explanation_report": explanation_report,
            "explanation": explanation,
            "processing_time_ms": processing_time_ms,
            "flag_count": record["flag_count"],
            "phishing_probability": record["phishing_probability"],
        }

    # ── helpers ───────────────────────────────────────────────────────────────

    async def _probe_url(self, url: str) -> dict[str, Any]:
        probe = {
            "ssl_valid": False,
            "redirect_count": 0,
            "final_url": url,
            "final_scheme": urlparse(url).scheme or "",
        }
        try:
            async with httpx.AsyncClient(
                follow_redirects=True,
                timeout=5.0,
                verify=True,
                headers={"User-Agent": "ISAFE-URL-Analyzer/2.0"},
            ) as client:
                response = None
                try:
                    response = await client.head(url)
                except (httpx.RequestError, httpx.TimeoutException):
                    response = None

                if response is None or response.status_code in {405, 501}:
                    try:
                        response = await client.get(url)
                    except (httpx.RequestError, httpx.TimeoutException):
                        response = None

                if response is not None:
                    probe["redirect_count"] = len(response.history)
                    probe["final_url"] = str(response.url)
                    probe["final_scheme"] = response.url.scheme
                    probe["ssl_valid"] = response.url.scheme == "https"
        except Exception:
            pass
        return probe

    def _build_domain_reputation(self, trust_score: float, domain_info: dict) -> dict[str, Any]:
        if trust_score >= 80:
            label = "Trusted"
        elif trust_score >= 55:
            label = "Watchlist"
        elif trust_score >= 30:
            label = "At Risk"
        else:
            label = "High Risk"

        host = domain_info.get("host", "")
        tld = domain_info.get("tld", "")
        subdomain_count = domain_info.get("subdomain_count", 0)
        dns_resolved = domain_info.get("dns_resolved", False)
        resolved_ip = domain_info.get("resolved_ip")
        entropy = domain_info.get("entropy", 0)

        signals = []
        if not dns_resolved:
            signals.append("DNS resolution failed")
        if tld in {".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top"}:
            signals.append(f"Low-trust TLD ({tld})")
        if subdomain_count >= 3:
            signals.append(f"Deep subdomain stack ({subdomain_count} levels)")
        if entropy > 3.8:
            signals.append(f"High domain entropy ({entropy:.2f})")
        if resolved_ip:
            signals.append(f"Resolved to {resolved_ip}")

        signal = "; ".join(signals) if signals else "No major reputation flags in structure"

        return {
            "label": label,
            "score": int(trust_score),
            "signal": signal,
            "host": host,
            "tld": tld,
            "subdomain_count": subdomain_count,
            "dns_resolved": dns_resolved,
            "resolved_ip": resolved_ip,
            "entropy": entropy,
        }

    def _risk_level(self, trust_score: float) -> str:
        if trust_score >= 80:
            return "low"
        if trust_score >= 55:
            return "medium"
        if trust_score >= 30:
            return "high"
        return "critical"

    def _verdict_from_risk(self, risk_level: str) -> str:
        return {
            "low": "real",
            "medium": "uncertain",
            "high": "fake",
            "critical": "fake",
        }[risk_level]
