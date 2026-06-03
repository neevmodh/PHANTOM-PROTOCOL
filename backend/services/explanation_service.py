import json
import logging
from typing import Any

from config import settings

logger = logging.getLogger(__name__)


class ExplanationService:
    model_name = "llama3-8b-8192"

    def explain_forensic_report(
        self,
        *,
        subject: str,
        confidence_score: float,
        trust_score: float,
        forensic_indicators: list[dict[str, Any]],
        metadata_anomalies: list[str],
        spectral_anomalies: list[str],
        phishing_indicators: list[str],
        manipulation_signals: list[str],
        context_type: str,
    ) -> dict[str, Any]:
        payload = {
            "subject": subject,
            "confidence_score": round(confidence_score, 4),
            "trust_score": round(trust_score, 4),
            "forensic_indicators": forensic_indicators,
            "metadata_anomalies": metadata_anomalies,
            "spectral_anomalies": spectral_anomalies,
            "phishing_indicators": phishing_indicators,
            "manipulation_signals": manipulation_signals,
            "context_type": context_type,
        }

        if not settings.GROQ_API_KEY:
            return self._fallback_report(payload)

        try:
            from groq import Groq  # type: ignore

            client = Groq(api_key=settings.GROQ_API_KEY)
            prompt = self._build_prompt(payload)
            response = client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are ISAFE, an enterprise-grade explainable AI forensic analyst. "
                            "Return only valid JSON. Use concise, technical, security-analyst language."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.25,
                max_tokens=650,
            )
            content = response.choices[0].message.content.strip()
            return self._parse_or_fallback(content, payload)
        except Exception as exc:
            logger.warning("Groq explanation generation failed: %s", exc)
            return self._fallback_report(payload)

    def _build_prompt(self, payload: dict[str, Any]) -> str:
        return json.dumps(
            {
                "task": "Generate an explainable forensic report.",
                "output_schema": {
                    "human_readable_explanation": "string",
                    "threat_reasoning": "string",
                    "key_suspicious_findings": [
                        {
                            "title": "string",
                            "detail": "string",
                            "severity": "low|medium|high|critical",
                            "confidence": 0.0,
                        }
                    ],
                    "severity_assessment": {
                        "level": "low|medium|high|critical",
                        "badge": "string",
                        "summary": "string",
                    },
                    "trust_analysis_summary": "string",
                },
                "instructions": [
                    "Write for a security operations audience.",
                    "Prefer crisp technical reasoning over generic AI language.",
                    "Be explicit about how the supplied signals support the assessment.",
                    "If signals are weak, state that the evidence is limited rather than overclaiming.",
                ],
                "input": payload,
            },
            ensure_ascii=False,
        )

    def _parse_or_fallback(self, content: str, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            parsed = json.loads(content)
            return self._normalize_report(parsed, payload)
        except Exception:
            logger.warning("Groq explanation response was not valid JSON; using fallback")
            return self._fallback_report(payload)

    def _normalize_report(self, report: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
        findings = report.get("key_suspicious_findings") or []
        if not isinstance(findings, list):
            findings = []

        severity = report.get("severity_assessment") or {}
        if not isinstance(severity, dict):
            severity = {}

        level = str(severity.get("level") or self._severity_level(payload["trust_score"]))
        badge = str(severity.get("badge") or self._badge_for_level(level))
        summary = str(severity.get("summary") or self._severity_summary(level, payload["trust_score"]))

        normalized_findings = []
        for finding in findings[:6]:
            if not isinstance(finding, dict):
                continue
            normalized_findings.append(
                {
                    "title": str(finding.get("title") or finding.get("indicator") or "Finding"),
                    "detail": str(finding.get("detail") or ""),
                    "severity": str(finding.get("severity") or level),
                    "confidence": float(finding.get("confidence") or 0.5),
                }
            )

        return {
            "human_readable_explanation": str(report.get("human_readable_explanation") or ""),
            "threat_reasoning": str(report.get("threat_reasoning") or ""),
            "key_suspicious_findings": normalized_findings,
            "severity_assessment": {
                "level": level,
                "badge": badge,
                "summary": summary,
            },
            "trust_analysis_summary": str(report.get("trust_analysis_summary") or ""),
            "generated_by": "groq",
        }

    def _fallback_report(self, payload: dict[str, Any]) -> dict[str, Any]:
        trust_score = float(payload["trust_score"])
        confidence_score = float(payload["confidence_score"])
        indicators = payload["forensic_indicators"]
        metadata_anomalies = payload["metadata_anomalies"]
        spectral_anomalies = payload["spectral_anomalies"]
        phishing_indicators = payload["phishing_indicators"]
        manipulation_signals = payload["manipulation_signals"]

        if trust_score >= 80:
            level = "low"
            badge = "Trusted"
        elif trust_score >= 55:
            level = "medium"
            badge = "Watchlist"
        elif trust_score >= 30:
            level = "high"
            badge = "High Risk"
        else:
            level = "critical"
            badge = "Critical"

        finding_list = []
        for item in indicators[:6]:
            title = str(item.get("indicator") or item.get("title") or "Forensic finding")
            detail = str(item.get("detail") or "")
            severity = str(item.get("severity") or level)
            finding_list.append(
                {
                    "title": title,
                    "detail": detail,
                    "severity": severity,
                    "confidence": min(0.95, max(0.35, float(item.get("score", 50)) / 100.0)),
                }
            )

        if not finding_list:
            if metadata_anomalies:
                finding_list.append(
                    {
                        "title": "Metadata anomalies",
                        "detail": "; ".join(metadata_anomalies),
                        "severity": level,
                        "confidence": 0.55,
                    }
                )
            if spectral_anomalies:
                finding_list.append(
                    {
                        "title": "Spectral anomalies",
                        "detail": "; ".join(spectral_anomalies),
                        "severity": level,
                        "confidence": 0.55,
                    }
                )
            if phishing_indicators:
                finding_list.append(
                    {
                        "title": "Phishing indicators",
                        "detail": "; ".join(phishing_indicators),
                        "severity": level,
                        "confidence": 0.55,
                    }
                )
            if manipulation_signals:
                finding_list.append(
                    {
                        "title": "Manipulation signals",
                        "detail": "; ".join(manipulation_signals),
                        "severity": level,
                        "confidence": 0.55,
                    }
                )

        explanation = (
            f"The forensic engine assessed this {payload['context_type']} as {level.upper()} risk with a trust score of {round(trust_score)}/100 and a confidence score of {round(confidence_score)}/100. "
            f"Observed signals point to {badge.lower()} behavior rather than a clean, trusted baseline."
        )
        threat_reasoning = (
            f"Risk is driven by {len(indicators)} forensic indicators, "
            f"metadata anomalies: {len(metadata_anomalies)}, spectral anomalies: {len(spectral_anomalies)}, "
            f"phishing indicators: {len(phishing_indicators)}, and manipulation signals: {len(manipulation_signals)}."
        )
        trust_summary = (
            f"Trust remains {'strong' if trust_score >= 80 else 'mixed' if trust_score >= 55 else 'weak'}: "
            f"the score sits at {round(trust_score)}/100 and the confidence is {round(confidence_score)}/100."
        )

        return {
            "human_readable_explanation": explanation,
            "threat_reasoning": threat_reasoning,
            "key_suspicious_findings": finding_list[:6],
            "severity_assessment": {
                "level": level,
                "badge": badge,
                "summary": self._severity_summary(level, trust_score),
            },
            "trust_analysis_summary": trust_summary,
            "generated_by": "fallback",
        }

    def _severity_level(self, trust_score: float) -> str:
        if trust_score >= 80:
            return "low"
        if trust_score >= 55:
            return "medium"
        if trust_score >= 30:
            return "high"
        return "critical"

    def _badge_for_level(self, level: str) -> str:
        return {
            "low": "Trusted",
            "medium": "Watchlist",
            "high": "High Risk",
            "critical": "Critical",
        }.get(level, "Watchlist")

    def _severity_summary(self, level: str, trust_score: float) -> str:
        if level == "low":
            return f"Signals remain within normal operating bounds at {round(trust_score)}/100 trust."
        if level == "medium":
            return f"Some suspicious signals were detected, but the document is not decisively compromised."
        if level == "high":
            return f"Multiple anomalies suggest adversarial manipulation or synthetic content."
        return f"The evidence strongly indicates a manipulated or untrusted artifact."
