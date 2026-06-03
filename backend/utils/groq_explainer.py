"""
Groq API integration for generating human-readable forensic explanations.
Supports both image and video analysis reports.
Falls back gracefully if the API key is missing or the call fails.
"""

import logging

logger = logging.getLogger(__name__)


# ── Image explanation ─────────────────────────────────────────────────────────

def _build_image_prompt(
    filename: str,
    verdict: str,
    confidence: float,
    trust_score: float,
    findings: list[dict],
) -> str:
    finding_lines = "\n".join(
        f"  - [{f['severity'].upper()}] {f['indicator']}: {f['detail']}"
        for f in findings
    ) or "  - No significant anomalies detected."

    return f"""You are ISAFE, an enterprise AI forensic analyst specialising in deepfake and image manipulation detection.

Analyse the following forensic report and write a concise, professional explanation (3-5 sentences) for a security analyst.
Be specific about the technical indicators. Do NOT use markdown. Do NOT use bullet points. Write in plain prose.

File: {filename}
Verdict: {verdict.upper()}
Confidence: {confidence * 100:.1f}%
Trust Score: {trust_score}/100

Forensic Indicators Found:
{finding_lines}

Write the explanation now:"""


def generate_explanation(
    filename: str,
    verdict: str,
    confidence: float,
    trust_score: float,
    findings: list[dict],
    groq_api_key: str,
) -> str:
    if not groq_api_key or groq_api_key == "your_groq_api_key_here":
        return _fallback_image_explanation(verdict, confidence, trust_score, findings)
    try:
        from groq import Groq  # type: ignore
        client = Groq(api_key=groq_api_key)
        prompt = _build_image_prompt(filename, verdict, confidence, trust_score, findings)
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.warning("Groq API call failed: %s — using fallback", exc)
        return _fallback_image_explanation(verdict, confidence, trust_score, findings)


def _fallback_image_explanation(
    verdict: str,
    confidence: float,
    trust_score: float,
    findings: list[dict],
) -> str:
    if not findings:
        return (
            f"The image passed all forensic checks with a trust score of {trust_score}/100. "
            "No significant manipulation indicators were detected across ELA, noise, frequency, "
            "texture, lighting, or compression analyses. The image is assessed as authentic."
        )
    top = findings[0]
    indicator_names = ", ".join(f["indicator"] for f in findings[:3])
    if verdict == "fake":
        return (
            f"Forensic analysis flagged this image as likely synthetic or manipulated "
            f"(confidence {confidence * 100:.1f}%, trust score {trust_score}/100). "
            f"The primary indicator is {top['indicator']}: {top['detail']} "
            f"Additional anomalies were detected in {indicator_names}. "
            f"The combination of {len(findings)} independent forensic signals strongly suggests "
            "this image has been digitally altered or AI-generated."
        )
    elif verdict == "uncertain":
        return (
            f"The image shows ambiguous forensic signals (confidence {confidence * 100:.1f}%, "
            f"trust score {trust_score}/100). "
            f"Suspicious indicators were found in {indicator_names}, "
            "but the evidence is not conclusive. "
            "Manual review by a forensic specialist is recommended."
        )
    return (
        f"The image appears authentic with a trust score of {trust_score}/100. "
        f"Minor anomalies were noted in {indicator_names} but fall within normal thresholds. "
        "No definitive manipulation signatures were identified."
    )


# ── Video explanation ─────────────────────────────────────────────────────────

def _build_video_prompt(
    filename: str,
    verdict: str,
    confidence: float,
    trust_score: float,
    frames_analyzed: int,
    suspicious_frames: int,
    duration: float,
    findings: list[dict],
) -> str:
    finding_lines = "\n".join(
        f"  - [{f['severity'].upper()}] {f['indicator']}: {f['detail']}"
        for f in findings
    ) or "  - No significant anomalies detected."

    return f"""You are ISAFE, an enterprise AI forensic analyst specialising in video deepfake detection.

Analyse the following video forensic report and write a concise, professional explanation (3-5 sentences) for a security analyst.
Be specific about temporal and visual indicators. Do NOT use markdown. Do NOT use bullet points. Write in plain prose.

File: {filename}
Duration: {duration:.1f}s
Frames Analyzed: {frames_analyzed} ({suspicious_frames} suspicious)
Verdict: {verdict.upper()}
Confidence: {confidence * 100:.1f}%
Trust Score: {trust_score}/100

Forensic Indicators Found:
{finding_lines}

Write the explanation now:"""


def generate_video_explanation(
    filename: str,
    verdict: str,
    confidence: float,
    trust_score: float,
    frames_analyzed: int,
    suspicious_frames: int,
    duration: float,
    findings: list[dict],
    groq_api_key: str,
) -> str:
    if not groq_api_key or groq_api_key == "your_groq_api_key_here":
        return _fallback_video_explanation(
            verdict, confidence, trust_score,
            frames_analyzed, suspicious_frames, findings
        )
    try:
        from groq import Groq  # type: ignore
        client = Groq(api_key=groq_api_key)
        prompt = _build_video_prompt(
            filename, verdict, confidence, trust_score,
            frames_analyzed, suspicious_frames, duration, findings
        )
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=350,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.warning("Groq video explanation failed: %s — using fallback", exc)
        return _fallback_video_explanation(
            verdict, confidence, trust_score,
            frames_analyzed, suspicious_frames, findings
        )


def _fallback_video_explanation(
    verdict: str,
    confidence: float,
    trust_score: float,
    frames_analyzed: int,
    suspicious_frames: int,
    findings: list[dict],
) -> str:
    if not findings:
        return (
            f"The video passed all temporal and per-frame forensic checks with a trust score of "
            f"{trust_score}/100. No significant deepfake indicators were detected across "
            f"{frames_analyzed} analyzed frames. The video is assessed as authentic."
        )
    top = findings[0]
    indicator_names = ", ".join(f["indicator"] for f in findings[:3])
    susp_pct = round(suspicious_frames / max(frames_analyzed, 1) * 100, 1)

    if verdict == "fake":
        return (
            f"Video forensic analysis flagged this content as likely deepfake or synthetically "
            f"manipulated (confidence {confidence * 100:.1f}%, trust score {trust_score}/100). "
            f"{suspicious_frames} of {frames_analyzed} frames ({susp_pct}%) triggered anomaly thresholds. "
            f"The primary indicator is {top['indicator']}: {top['detail']} "
            f"Corroborating signals were found in {indicator_names}, "
            "collectively indicating face-swap or GAN-based video synthesis."
        )
    elif verdict == "uncertain":
        return (
            f"The video shows ambiguous forensic signals (confidence {confidence * 100:.1f}%, "
            f"trust score {trust_score}/100). "
            f"{suspicious_frames} of {frames_analyzed} frames showed elevated anomaly scores. "
            f"Suspicious indicators were found in {indicator_names}, "
            "but the evidence is not conclusive. Expert review is recommended."
        )
    return (
        f"The video appears authentic with a trust score of {trust_score}/100. "
        f"Analysis of {frames_analyzed} frames found only minor anomalies in {indicator_names}, "
        "all within acceptable thresholds. No definitive deepfake signatures were identified."
    )


# ── Audio explanation ─────────────────────────────────────────────────────────

def _build_audio_prompt(
    filename: str,
    verdict: str,
    confidence: float,
    trust_score: float,
    duration: float,
    voice_clone_prob: float,
    findings: list[dict],
) -> str:
    finding_lines = "\n".join(
        f"  - [{f['severity'].upper()}] {f['indicator']}: {f['detail']}"
        for f in findings
    ) or "  - No significant anomalies detected."

    return f"""You are ISAFE, an enterprise AI forensic analyst specialising in voice clone and synthetic speech detection.

Analyse the following audio forensic report and write a concise, professional explanation (3-5 sentences) for a security analyst.
Be specific about acoustic and signal-processing indicators. Do NOT use markdown. Do NOT use bullet points. Write in plain prose.

File: {filename}
Duration: {duration:.1f}s
Verdict: {verdict.upper()}
Confidence: {confidence * 100:.1f}%
Trust Score: {trust_score}/100
Voice Clone Probability: {voice_clone_prob * 100:.1f}%

Forensic Indicators Found:
{finding_lines}

Write the explanation now:"""


def generate_audio_explanation(
    filename: str,
    verdict: str,
    confidence: float,
    trust_score: float,
    duration: float,
    voice_clone_prob: float,
    findings: list[dict],
    groq_api_key: str,
) -> str:
    if not groq_api_key or groq_api_key == "your_groq_api_key_here":
        return _fallback_audio_explanation(verdict, confidence, trust_score, voice_clone_prob, findings)
    try:
        from groq import Groq  # type: ignore
        client = Groq(api_key=groq_api_key)
        prompt = _build_audio_prompt(filename, verdict, confidence, trust_score, duration, voice_clone_prob, findings)
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=320,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.warning("Groq audio explanation failed: %s — using fallback", exc)
        return _fallback_audio_explanation(verdict, confidence, trust_score, voice_clone_prob, findings)


def _fallback_audio_explanation(
    verdict: str,
    confidence: float,
    trust_score: float,
    voice_clone_prob: float,
    findings: list[dict],
) -> str:
    if not findings:
        return (
            f"The audio passed all forensic checks with a trust score of {trust_score}/100. "
            "No significant voice cloning or synthetic speech indicators were detected across "
            "MFCC, pitch, spectral, noise, and reverberation analyses. The audio is assessed as authentic."
        )
    top = findings[0]
    indicator_names = ", ".join(f["indicator"] for f in findings[:3])
    clone_pct = round(voice_clone_prob * 100, 1)

    if verdict == "fake":
        return (
            f"Audio forensic analysis flagged this recording as likely AI-generated or voice-cloned "
            f"(confidence {confidence * 100:.1f}%, trust score {trust_score}/100, "
            f"voice clone probability {clone_pct}%). "
            f"The primary indicator is {top['indicator']}: {top['detail']} "
            f"Corroborating anomalies were detected in {indicator_names}. "
            "The combination of these acoustic signals is consistent with TTS synthesis or voice conversion."
        )
    elif verdict == "uncertain":
        return (
            f"The audio shows ambiguous forensic signals (confidence {confidence * 100:.1f}%, "
            f"trust score {trust_score}/100, voice clone probability {clone_pct}%). "
            f"Suspicious indicators were found in {indicator_names}, "
            "but the evidence is not conclusive. Expert acoustic review is recommended."
        )
    return (
        f"The audio appears authentic with a trust score of {trust_score}/100 "
        f"and a low voice clone probability of {clone_pct}%. "
        f"Minor anomalies were noted in {indicator_names} but fall within natural speech thresholds. "
        "No definitive synthetic speech signatures were identified."
    )
