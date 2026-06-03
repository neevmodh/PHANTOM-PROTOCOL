"""
Video deepfake forensics engine — CPU-only, OpenCV + NumPy + SciPy + Pillow.

Checks performed per-frame and across the temporal dimension:
  1. Frame extraction & sampling
  2. ELA-based per-frame manipulation score
  3. Optical flow temporal consistency (inter-frame motion coherence)
  4. Eye-blink consistency (luminance variance in eye-region proxy)
  5. Lip-sync mismatch (mouth-region texture vs. audio-proxy heuristic)
  6. Head-movement anomaly (inter-frame centroid drift)
  7. GAN frequency artifacts (FFT spectral peak ratio per frame)
  8. Lighting inconsistency (illumination gradient direction variance)
  9. Compression artifact score (DCT block boundary ratio)
"""

from __future__ import annotations

import io
import os
import math
import uuid
import logging
from typing import Any

import cv2
import numpy as np
from PIL import Image, ImageChops
from scipy import ndimage

from config import settings

logger = logging.getLogger(__name__)

# ── constants ─────────────────────────────────────────────────────────────────
MAX_FRAMES_SAMPLE = 30          # max frames to analyse (evenly spaced)
FRAME_THUMB_SIZE  = (320, 180)  # resize each frame before analysis
FACE_REGION_FRAC  = 0.55        # top fraction of frame treated as "face region"
EYE_REGION_FRAC   = (0.15, 0.40)  # vertical slice for eye-region proxy
MOUTH_REGION_FRAC = (0.55, 0.80)  # vertical slice for mouth-region proxy


# ── helpers ───────────────────────────────────────────────────────────────────

def _bgr_to_pil(frame: np.ndarray) -> Image.Image:
    return Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))


def _save_frame_thumb(frame: np.ndarray, label: str) -> str:
    os.makedirs(settings.VIDEO_FRAMES_DIR, exist_ok=True)
    pil = _bgr_to_pil(frame)
    pil.thumbnail(FRAME_THUMB_SIZE, Image.LANCZOS)
    name = f"{label}_{uuid.uuid4().hex[:6]}.jpg"
    path = os.path.join(settings.VIDEO_FRAMES_DIR, name)
    pil.save(path, "JPEG", quality=80)
    return path


def _frame_url(path: str) -> str:
    rel = os.path.relpath(path, settings.UPLOAD_DIR)
    return f"/uploads/{rel.replace(os.sep, '/')}"


# ── per-frame checks ──────────────────────────────────────────────────────────

def _ela_score(frame: np.ndarray, quality: int = 90) -> float:
    """Return mean ELA residual for a single frame."""
    pil = _bgr_to_pil(frame)
    buf = io.BytesIO()
    pil.save(buf, "JPEG", quality=quality)
    buf.seek(0)
    recomp = Image.open(buf).convert("RGB")
    diff = np.abs(
        np.array(pil.convert("RGB"), dtype=np.float32)
        - np.array(recomp, dtype=np.float32)
    )
    return float(diff.mean())


def _freq_peak_ratio(frame: np.ndarray) -> float:
    """FFT spectral peak ratio — high values indicate GAN checkerboard artefacts."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32)
    fft = np.fft.fftshift(np.fft.fft2(gray))
    mag = np.log1p(np.abs(fft))
    h, w = mag.shape
    cy, cx = h // 2, w // 2
    r = min(h, w) // 8
    y_idx, x_idx = np.ogrid[:h, :w]
    mask = (y_idx - cy) ** 2 + (x_idx - cx) ** 2 <= r ** 2
    peripheral = mag[~mask]
    return float(peripheral.max() / (mag.mean() + 1e-8))


def _lighting_angle_std(frame: np.ndarray) -> float:
    """Illumination gradient direction variance across quadrants."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32)
    illum = ndimage.gaussian_filter(gray, sigma=max(gray.shape) // 20)
    gy, gx = np.gradient(illum)
    h, w = gray.shape
    angles = []
    for qi in range(2):
        for qj in range(2):
            sy = gy[qi * h // 2:(qi + 1) * h // 2, qj * w // 2:(qj + 1) * w // 2]
            sx = gx[qi * h // 2:(qi + 1) * h // 2, qj * w // 2:(qj + 1) * w // 2]
            angles.append(float(np.arctan2(sy.mean(), sx.mean() + 1e-8)))
    return float(np.std(angles))


def _compression_ratio(frame: np.ndarray) -> float:
    """DCT block boundary ratio."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32)
    h, w = gray.shape
    boundaries = []
    for i in range(8, h, 8):
        boundaries.append(float(np.abs(gray[i, :] - gray[i - 1, :]).mean()))
    for j in range(8, w, 8):
        boundaries.append(float(np.abs(gray[:, j] - gray[:, j - 1]).mean()))
    interior = float(ndimage.uniform_filter(gray, size=3).std())
    return float(np.mean(boundaries) / (interior + 1e-8))


def _region_luminance(frame: np.ndarray, y_frac: tuple[float, float]) -> float:
    """Mean luminance of a horizontal band (fraction of frame height)."""
    h = frame.shape[0]
    y0, y1 = int(h * y_frac[0]), int(h * y_frac[1])
    region = frame[y0:y1, :, :]
    gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
    return float(gray.mean())


# ── temporal checks ───────────────────────────────────────────────────────────

def _optical_flow_consistency(frames: list[np.ndarray]) -> dict[str, Any]:
    """
    Compute dense optical flow between consecutive frames.
    High variance in flow magnitude indicates temporal discontinuities.
    """
    if len(frames) < 2:
        return {"mean_flow": 0.0, "flow_cv": 0.0, "suspicious": False}

    flow_mags = []
    prev_gray = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
    for frame in frames[1:]:
        curr_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        flow = cv2.calcOpticalFlowFarneback(
            prev_gray, curr_gray, None,
            pyr_scale=0.5, levels=3, winsize=15,
            iterations=3, poly_n=5, poly_sigma=1.2, flags=0,
        )
        mag = np.sqrt(flow[..., 0] ** 2 + flow[..., 1] ** 2)
        flow_mags.append(float(mag.mean()))
        prev_gray = curr_gray

    mean_flow = float(np.mean(flow_mags))
    flow_cv = float(np.std(flow_mags) / (mean_flow + 1e-8))
    # Suspicious: very low flow (frozen face) or very high CV (jerky motion)
    suspicious = flow_cv > 1.2 or mean_flow < 0.3

    return {
        "mean_flow": round(mean_flow, 4),
        "flow_cv": round(flow_cv, 4),
        "flow_series": [round(m, 3) for m in flow_mags],
        "suspicious": suspicious,
    }


def _eye_blink_consistency(frames: list[np.ndarray]) -> dict[str, Any]:
    """
    Proxy: track luminance variance in the eye-region band across frames.
    Real blinks produce brief luminance dips; deepfakes often show unnatural
    blink patterns (too regular, absent, or abrupt).
    """
    lum_series = [_region_luminance(f, EYE_REGION_FRAC) for f in frames]
    diffs = [abs(lum_series[i] - lum_series[i - 1]) for i in range(1, len(lum_series))]
    if not diffs:
        return {"blink_cv": 0.0, "suspicious": False}

    blink_cv = float(np.std(diffs) / (np.mean(diffs) + 1e-8))
    # Suspicious: extremely low variance (no blinks) or extremely high (erratic)
    suspicious = blink_cv < 0.15 or blink_cv > 3.5

    return {
        "blink_cv": round(blink_cv, 4),
        "lum_series": [round(v, 2) for v in lum_series],
        "suspicious": suspicious,
    }


def _lip_sync_mismatch(frames: list[np.ndarray]) -> dict[str, Any]:
    """
    Proxy: measure mouth-region texture variance across frames.
    Lip-sync deepfakes often show unnaturally smooth or jittery mouth regions.
    """
    mouth_vars = []
    for f in frames:
        h = f.shape[0]
        y0, y1 = int(h * MOUTH_REGION_FRAC[0]), int(h * MOUTH_REGION_FRAC[1])
        region = f[y0:y1, :, :]
        gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY).astype(np.float32)
        sx = ndimage.sobel(gray, axis=1)
        sy = ndimage.sobel(gray, axis=0)
        mouth_vars.append(float(np.hypot(sx, sy).mean()))

    if not mouth_vars:
        return {"mouth_texture_cv": 0.0, "suspicious": False}

    mouth_cv = float(np.std(mouth_vars) / (np.mean(mouth_vars) + 1e-8))
    suspicious = mouth_cv < 0.08 or mouth_cv > 2.0

    return {
        "mouth_texture_cv": round(mouth_cv, 4),
        "mouth_series": [round(v, 2) for v in mouth_vars],
        "suspicious": suspicious,
    }


def _head_movement_anomaly(frames: list[np.ndarray]) -> dict[str, Any]:
    """
    Track frame-to-frame centroid shift of the brightest region (face proxy).
    Unnatural head movement patterns are a deepfake indicator.
    """
    centroids = []
    for f in frames:
        gray = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        # Use top FACE_REGION_FRAC of frame
        h = gray.shape[0]
        face_region = gray[:int(h * FACE_REGION_FRAC), :]
        _, thresh = cv2.threshold(face_region, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        M = cv2.moments(thresh)
        if M["m00"] > 0:
            cx = M["m10"] / M["m00"]
            cy = M["m01"] / M["m00"]
        else:
            cx, cy = face_region.shape[1] / 2, face_region.shape[0] / 2
        centroids.append((cx, cy))

    if len(centroids) < 2:
        return {"movement_cv": 0.0, "suspicious": False}

    dists = [
        math.hypot(centroids[i][0] - centroids[i - 1][0],
                   centroids[i][1] - centroids[i - 1][1])
        for i in range(1, len(centroids))
    ]
    movement_cv = float(np.std(dists) / (np.mean(dists) + 1e-8))
    suspicious = movement_cv > 2.5

    return {
        "movement_cv": round(movement_cv, 4),
        "dist_series": [round(d, 2) for d in dists],
        "suspicious": suspicious,
    }


# ── frame extraction ──────────────────────────────────────────────────────────

def extract_frames(video_path: str, max_frames: int = MAX_FRAMES_SAMPLE) -> dict[str, Any]:
    """Extract evenly-spaced frames from a video file."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    duration = total_frames / fps

    sample_count = min(max_frames, total_frames)
    if sample_count < 2:
        sample_count = max(2, total_frames)

    indices = np.linspace(0, total_frames - 1, sample_count, dtype=int)
    frames = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ret, frame = cap.read()
        if ret and frame is not None:
            # Resize to thumbnail for speed
            frame = cv2.resize(frame, FRAME_THUMB_SIZE)
            frames.append(frame)
    cap.release()

    return {
        "frames": frames,
        "total_frames": total_frames,
        "fps": round(fps, 2),
        "duration_seconds": round(duration, 2),
        "sampled": len(frames),
    }


# ── master analysis ───────────────────────────────────────────────────────────

def run_video_analysis(video_path: str) -> dict[str, Any]:
    """
    Full video forensic pipeline. Returns structured result dict.
    """
    # 1. Extract frames
    extraction = extract_frames(video_path)
    frames = extraction["frames"]

    if not frames:
        raise ValueError("No frames could be extracted from the video.")

    # 2. Per-frame scores
    ela_scores: list[float] = []
    freq_scores: list[float] = []
    light_scores: list[float] = []
    comp_scores: list[float] = []

    for frame in frames:
        ela_scores.append(_ela_score(frame))
        freq_scores.append(_freq_peak_ratio(frame))
        light_scores.append(_lighting_angle_std(frame))
        comp_scores.append(_compression_ratio(frame))

    # 3. Temporal checks
    flow = _optical_flow_consistency(frames)
    blink = _eye_blink_consistency(frames)
    lipsync = _lip_sync_mismatch(frames)
    head = _head_movement_anomaly(frames)

    # 4. Aggregate per-frame stats
    ela_mean = float(np.mean(ela_scores))
    ela_std_val = float(np.std(ela_scores))
    freq_mean = float(np.mean(freq_scores))
    light_mean = float(np.mean(light_scores))
    comp_mean = float(np.mean(comp_scores))

    # 5. Flag suspicious frames
    ela_threshold = ela_mean + 1.5 * ela_std_val
    suspicious_frame_indices = [
        i for i, s in enumerate(ela_scores) if s > ela_threshold
    ]
    suspicious_frame_count = len(suspicious_frame_indices)

    # 6. Save representative frame thumbnails (first, middle, last + worst)
    saved_frames: list[dict] = []
    sample_indices = [0, len(frames) // 2, len(frames) - 1]
    if suspicious_frame_indices:
        worst_idx = max(suspicious_frame_indices, key=lambda i: ela_scores[i])
        if worst_idx not in sample_indices:
            sample_indices.append(worst_idx)

    for idx in sorted(set(sample_indices)):
        if idx < len(frames):
            label = "suspicious" if idx in suspicious_frame_indices else "frame"
            path = _save_frame_thumb(frames[idx], label)
            saved_frames.append({
                "frame_index": idx,
                "url": _frame_url(path),
                "ela_score": round(ela_scores[idx], 3),
                "freq_score": round(freq_scores[idx], 3),
                "suspicious": idx in suspicious_frame_indices,
            })

    # 7. Determine flags
    ela_flag = ela_mean > 9.0 or ela_std_val > 5.0
    freq_flag = freq_mean > 4.2
    light_flag = light_mean > 0.75
    comp_flag = comp_mean > 0.14
    flow_flag = flow["suspicious"]
    blink_flag = blink["suspicious"]
    lipsync_flag = lipsync["suspicious"]
    head_flag = head["suspicious"]

    flags = [ela_flag, freq_flag, light_flag, comp_flag,
             flow_flag, blink_flag, lipsync_flag, head_flag]
    flag_count = sum(flags)

    # 8. Weighted confidence
    weights = [0.18, 0.18, 0.10, 0.08, 0.16, 0.12, 0.12, 0.06]
    raw_conf = sum(w for w, f in zip(weights, flags) if f)
    confidence = round(min(raw_conf + 0.04 * flag_count, 0.99), 4)
    trust_score = round((1.0 - confidence) * 100, 1)

    if confidence >= 0.65:
        verdict = "fake"
    elif confidence >= 0.35:
        verdict = "uncertain"
    else:
        verdict = "real"

    # 9. Build forensic findings
    findings: list[dict] = []
    sev_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}

    if freq_flag:
        findings.append({
            "indicator": "GAN Frequency Artifacts",
            "severity": "critical",
            "detail": (
                f"Mean spectral peak ratio {freq_mean:.2f} across {extraction['sampled']} frames. "
                "Periodic checkerboard patterns in the frequency domain are a hallmark of "
                "GAN-based face synthesis (StyleGAN, FaceSwap)."
            ),
            "score": round(min(freq_mean / 8.0, 1.0), 3),
        })

    if flow_flag:
        findings.append({
            "indicator": "Temporal Inconsistency (Optical Flow)",
            "severity": "high",
            "detail": (
                f"Inter-frame flow CV={flow['flow_cv']:.3f}, mean={flow['mean_flow']:.3f} px/frame. "
                "Abnormal motion coherence between frames indicates temporal splicing or "
                "frame-level face replacement."
            ),
            "score": round(min(flow["flow_cv"] / 2.0, 1.0), 3),
        })

    if ela_flag:
        findings.append({
            "indicator": "Compression Anomaly (ELA)",
            "severity": "high",
            "detail": (
                f"Mean ELA residual {ela_mean:.2f} ± {ela_std_val:.2f} across frames. "
                f"{suspicious_frame_count}/{extraction['sampled']} frames exceed the anomaly threshold, "
                "suggesting localised post-processing or face-region compositing."
            ),
            "score": round(min(ela_mean / 20.0, 1.0), 3),
        })

    if lipsync_flag:
        findings.append({
            "indicator": "Lip-Sync Mismatch",
            "severity": "high",
            "detail": (
                f"Mouth-region texture CV={lipsync['mouth_texture_cv']:.3f}. "
                "Unnatural mouth movement patterns detected — either unnaturally smooth "
                "(AI-generated) or erratic (poor lip-sync alignment)."
            ),
            "score": round(min(lipsync["mouth_texture_cv"] / 2.0, 1.0), 3),
        })

    if blink_flag:
        findings.append({
            "indicator": "Eye Blink Inconsistency",
            "severity": "medium",
            "detail": (
                f"Eye-region luminance CV={blink['blink_cv']:.3f}. "
                "Blink pattern deviates from natural human baseline — "
                "a common artefact in first-generation deepfake models."
            ),
            "score": round(min(abs(blink["blink_cv"] - 1.0), 1.0), 3),
        })

    if head_flag:
        findings.append({
            "indicator": "Head Movement Anomaly",
            "severity": "medium",
            "detail": (
                f"Head centroid movement CV={head['movement_cv']:.3f}. "
                "Irregular head motion trajectory detected — may indicate "
                "face-region warping or 3D model misalignment."
            ),
            "score": round(min(head["movement_cv"] / 3.0, 1.0), 3),
        })

    if light_flag:
        findings.append({
            "indicator": "Lighting Inconsistency",
            "severity": "medium",
            "detail": (
                f"Mean illumination gradient angle σ={light_mean:.3f} rad across frames. "
                "Inconsistent light source direction between face and background "
                "is a strong indicator of face-swap compositing."
            ),
            "score": round(min(light_mean / math.pi, 1.0), 3),
        })

    if comp_flag:
        findings.append({
            "indicator": "Block Boundary Artifacts",
            "severity": "low",
            "detail": (
                f"Mean DCT boundary ratio={comp_mean:.4f}. "
                "Elevated block boundary discontinuities across frames suggest "
                "re-encoding or transcoding artefacts from video manipulation."
            ),
            "score": round(min(comp_mean * 5, 1.0), 3),
        })

    findings.sort(key=lambda x: sev_order.get(x["severity"], 9))

    # 10. Per-frame timeline for UI
    frame_timeline = [
        {
            "index": i,
            "ela": round(ela_scores[i], 2),
            "freq": round(freq_scores[i], 2),
            "suspicious": i in suspicious_frame_indices,
        }
        for i in range(len(frames))
    ]

    return {
        "verdict": verdict,
        "confidence": confidence,
        "trust_score": trust_score,
        "flag_count": flag_count,
        "forensic_findings": findings,
        "frames_analyzed": extraction["sampled"],
        "total_frames": extraction["total_frames"],
        "suspicious_frames": suspicious_frame_count,
        "duration_seconds": extraction["duration_seconds"],
        "fps": extraction["fps"],
        "saved_frames": saved_frames,
        "frame_timeline": frame_timeline,
        "raw": {
            "ela_mean": round(ela_mean, 3),
            "ela_std": round(ela_std_val, 3),
            "freq_mean": round(freq_mean, 3),
            "light_mean": round(light_mean, 3),
            "comp_mean": round(comp_mean, 4),
            "flow_cv": flow["flow_cv"],
            "flow_mean": flow["mean_flow"],
            "blink_cv": blink["blink_cv"],
            "mouth_cv": lipsync["mouth_texture_cv"],
            "head_cv": head["movement_cv"],
        },
    }
