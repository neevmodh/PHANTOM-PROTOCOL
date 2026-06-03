"""
Lightweight image forensics engine.
Runs entirely on CPU with Pillow + NumPy + SciPy — no heavy ML framework needed.
Implements:
  - ELA  (Error Level Analysis)
  - Noise variance analysis
  - DCT frequency artifact detection
  - JPEG ghost detection
  - Texture inconsistency scoring
  - Lighting gradient analysis
  - GAN artifact heuristics (checkerboard patterns, spectral peaks)
"""

import io
import os
import math
import uuid
import numpy as np
from PIL import Image, ImageFilter, ImageChops, ImageEnhance
from scipy import ndimage
from typing import Any
from config import settings


# ── helpers ──────────────────────────────────────────────────────────────────

def _to_array(img: Image.Image) -> np.ndarray:
    return np.array(img.convert("RGB"), dtype=np.float32)


def _save_heatmap(heatmap: np.ndarray, prefix: str = "heatmap") -> str:
    """Normalise a 2-D float array to 0-255, apply a false-colour map and save."""
    os.makedirs(settings.HEATMAP_DIR, exist_ok=True)
    h_norm = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min() + 1e-8)
    h_uint8 = (h_norm * 255).astype(np.uint8)

    # Jet-like false colour: blue→cyan→green→yellow→red
    r = np.clip(1.5 - np.abs(h_norm * 4 - 3), 0, 1)
    g = np.clip(1.5 - np.abs(h_norm * 4 - 2), 0, 1)
    b = np.clip(1.5 - np.abs(h_norm * 4 - 1), 0, 1)
    rgb = (np.stack([r, g, b], axis=-1) * 255).astype(np.uint8)

    heatmap_img = Image.fromarray(rgb, "RGB")
    filename = f"{prefix}_{uuid.uuid4().hex[:8]}.png"
    path = os.path.join(settings.HEATMAP_DIR, filename)
    heatmap_img.save(path)
    return path


# ── ELA ───────────────────────────────────────────────────────────────────────

def ela_analysis(img: Image.Image, quality: int = 90) -> dict[str, Any]:
    """
    Error Level Analysis: re-compress at known quality and measure residual.
    High residuals in localised regions indicate tampering.
    """
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=quality)
    buf.seek(0)
    recompressed = Image.open(buf).convert("RGB")

    diff = ImageChops.difference(img.convert("RGB"), recompressed)
    diff_arr = np.array(diff, dtype=np.float32)

    # Amplify for visibility
    ela_map = diff_arr.mean(axis=2)
    ela_score = float(ela_map.mean())
    ela_max = float(ela_map.max())
    ela_std = float(ela_map.std())

    # Suspicious if mean residual > threshold
    suspicious = ela_score > 8.0 or ela_std > 12.0

    heatmap_path = _save_heatmap(ela_map, "ela")

    return {
        "score": round(ela_score, 3),
        "max": round(ela_max, 3),
        "std": round(ela_std, 3),
        "suspicious": suspicious,
        "heatmap_path": heatmap_path,
        "ela_map": ela_map,
    }


# ── Noise analysis ────────────────────────────────────────────────────────────

def noise_analysis(img: Image.Image) -> dict[str, Any]:
    """
    Estimate local noise variance using a Laplacian filter.
    Inconsistent noise across regions suggests compositing.
    """
    gray = np.array(img.convert("L"), dtype=np.float32)
    laplacian = ndimage.laplace(gray)
    noise_map = np.abs(laplacian)

    # Divide into 4×4 blocks and measure variance
    h, w = noise_map.shape
    bh, bw = h // 4, w // 4
    block_vars = []
    for i in range(4):
        for j in range(4):
            block = noise_map[i * bh:(i + 1) * bh, j * bw:(j + 1) * bw]
            block_vars.append(float(block.var()))

    variance_cv = float(np.std(block_vars) / (np.mean(block_vars) + 1e-8))
    suspicious = variance_cv > 0.6

    return {
        "mean_noise": round(float(noise_map.mean()), 3),
        "variance_cv": round(variance_cv, 4),
        "block_variances": [round(v, 2) for v in block_vars],
        "suspicious": suspicious,
        "noise_map": noise_map,
    }


# ── DCT frequency artifacts ───────────────────────────────────────────────────

def frequency_analysis(img: Image.Image) -> dict[str, Any]:
    """
    Compute 2-D FFT of luminance channel.
    GAN-generated images often show periodic spectral peaks (checkerboard artefacts).
    """
    gray = np.array(img.convert("L"), dtype=np.float32)
    fft = np.fft.fft2(gray)
    fft_shift = np.fft.fftshift(fft)
    magnitude = np.log1p(np.abs(fft_shift))

    # Detect anomalous peaks outside DC component
    h, w = magnitude.shape
    center_mask = np.zeros_like(magnitude, dtype=bool)
    cy, cx = h // 2, w // 2
    r = min(h, w) // 8
    y_idx, x_idx = np.ogrid[:h, :w]
    center_mask[(y_idx - cy) ** 2 + (x_idx - cx) ** 2 <= r ** 2] = True

    peripheral = magnitude[~center_mask]
    peak_ratio = float(peripheral.max() / (magnitude.mean() + 1e-8))
    suspicious = peak_ratio > 4.5

    return {
        "peak_ratio": round(peak_ratio, 4),
        "mean_magnitude": round(float(magnitude.mean()), 4),
        "suspicious": suspicious,
        "freq_map": magnitude,
    }


# ── JPEG ghost ────────────────────────────────────────────────────────────────

def jpeg_ghost_analysis(img: Image.Image) -> dict[str, Any]:
    """
    JPEG ghost: re-save at multiple qualities and find the quality that minimises
    the difference. Inconsistency across regions reveals double-compression.
    """
    arr = np.array(img.convert("RGB"), dtype=np.float32)
    qualities = [60, 70, 80, 90]
    min_diffs = []

    for q in qualities:
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="JPEG", quality=q)
        buf.seek(0)
        recomp = np.array(Image.open(buf).convert("RGB"), dtype=np.float32)
        diff = np.abs(arr - recomp).mean(axis=2)
        min_diffs.append(diff)

    ghost_map = np.stack(min_diffs, axis=0).min(axis=0)
    ghost_score = float(ghost_map.std())
    suspicious = ghost_score > 6.0

    return {
        "ghost_score": round(ghost_score, 3),
        "suspicious": suspicious,
        "ghost_map": ghost_map,
    }


# ── Texture inconsistency ─────────────────────────────────────────────────────

def texture_analysis(img: Image.Image) -> dict[str, Any]:
    """
    Measure local binary pattern-like texture variance across image patches.
    Blended regions from different sources show abrupt texture discontinuities.
    """
    gray = np.array(img.convert("L"), dtype=np.float32)
    # Sobel edges as texture proxy
    sx = ndimage.sobel(gray, axis=1)
    sy = ndimage.sobel(gray, axis=0)
    edge_mag = np.hypot(sx, sy)

    h, w = edge_mag.shape
    patch_size = max(h, w) // 8
    patch_means = []
    for i in range(0, h - patch_size, patch_size):
        for j in range(0, w - patch_size, patch_size):
            patch_means.append(float(edge_mag[i:i + patch_size, j:j + patch_size].mean()))

    texture_cv = float(np.std(patch_means) / (np.mean(patch_means) + 1e-8))
    suspicious = texture_cv > 0.55

    return {
        "texture_cv": round(texture_cv, 4),
        "patch_means": [round(m, 2) for m in patch_means],
        "suspicious": suspicious,
        "edge_map": edge_mag,
    }


# ── Lighting analysis ─────────────────────────────────────────────────────────

def lighting_analysis(img: Image.Image) -> dict[str, Any]:
    """
    Estimate illumination gradient consistency.
    Deepfakes often have mismatched lighting between face and background.
    """
    arr = _to_array(img)
    luminance = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]

    # Smooth to get illumination map
    illum = ndimage.gaussian_filter(luminance, sigma=max(luminance.shape) // 20)
    gradient_y, gradient_x = np.gradient(illum)
    gradient_mag = np.hypot(gradient_x, gradient_y)

    # Directional consistency: compute dominant gradient direction per quadrant
    h, w = gradient_mag.shape
    quadrant_dirs = []
    for qi in range(2):
        for qj in range(2):
            gy = gradient_y[qi * h // 2:(qi + 1) * h // 2, qj * w // 2:(qj + 1) * w // 2]
            gx = gradient_x[qi * h // 2:(qi + 1) * h // 2, qj * w // 2:(qj + 1) * w // 2]
            angle = float(np.arctan2(gy.mean(), gx.mean() + 1e-8))
            quadrant_dirs.append(angle)

    angle_std = float(np.std(quadrant_dirs))
    suspicious = angle_std > 0.8

    return {
        "angle_std": round(angle_std, 4),
        "quadrant_angles": [round(a, 4) for a in quadrant_dirs],
        "suspicious": suspicious,
        "illum_map": gradient_mag,
    }


# ── Compression anomaly ───────────────────────────────────────────────────────

def compression_analysis(img: Image.Image) -> dict[str, Any]:
    """
    Detect blocking artefacts from inconsistent JPEG compression history.
    """
    gray = np.array(img.convert("L"), dtype=np.float32)
    h, w = gray.shape
    block_size = 8

    # Measure discontinuity at 8×8 block boundaries
    h_boundaries = []
    for i in range(block_size, h, block_size):
        row_diff = np.abs(gray[i, :] - gray[i - 1, :]).mean()
        h_boundaries.append(float(row_diff))

    v_boundaries = []
    for j in range(block_size, w, block_size):
        col_diff = np.abs(gray[:, j] - gray[:, j - 1]).mean()
        v_boundaries.append(float(col_diff))

    boundary_score = float(np.mean(h_boundaries + v_boundaries))
    interior_score = float(ndimage.uniform_filter(gray, size=3).std())
    ratio = boundary_score / (interior_score + 1e-8)
    suspicious = ratio > 0.15

    return {
        "boundary_score": round(boundary_score, 4),
        "interior_score": round(interior_score, 4),
        "ratio": round(ratio, 4),
        "suspicious": suspicious,
    }


# ── Master analysis ───────────────────────────────────────────────────────────

def run_full_analysis(image_path: str) -> dict[str, Any]:
    """
    Run all forensic checks and aggregate into a single result dict.
    Returns scores, findings, heatmap path, and raw indicator data.
    """
    img = Image.open(image_path)
    # Resize large images to cap processing time
    max_dim = 1024
    if max(img.size) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)

    ela = ela_analysis(img)
    noise = noise_analysis(img)
    freq = frequency_analysis(img)
    ghost = jpeg_ghost_analysis(img)
    texture = texture_analysis(img)
    lighting = lighting_analysis(img)
    compression = compression_analysis(img)

    # ── Composite heatmap: blend ELA + noise + ghost ──────────────────────────
    ela_map = ela["ela_map"]
    noise_map = noise["noise_map"]
    ghost_map = ghost["ghost_map"]

    # Resize all maps to same shape
    target_h, target_w = ela_map.shape
    def _resize_map(m: np.ndarray) -> np.ndarray:
        if m.shape == (target_h, target_w):
            return m
        img_tmp = Image.fromarray(
            ((m - m.min()) / (m.max() - m.min() + 1e-8) * 255).astype(np.uint8)
        )
        img_tmp = img_tmp.resize((target_w, target_h), Image.BILINEAR)
        return np.array(img_tmp, dtype=np.float32)

    composite = (
        0.45 * _resize_map(ela_map)
        + 0.30 * _resize_map(noise_map)
        + 0.25 * _resize_map(ghost_map)
    )
    heatmap_path = _save_heatmap(composite, "composite")

    # ── Scoring ───────────────────────────────────────────────────────────────
    flags = [
        ela["suspicious"],
        noise["suspicious"],
        freq["suspicious"],
        ghost["suspicious"],
        texture["suspicious"],
        lighting["suspicious"],
        compression["suspicious"],
    ]
    flag_count = sum(flags)

    # Weighted confidence: each flag contributes differently
    weights = [0.25, 0.15, 0.20, 0.15, 0.10, 0.10, 0.05]
    raw_confidence = sum(w for w, f in zip(weights, flags) if f)
    confidence = round(min(raw_confidence + 0.05 * flag_count, 0.99), 4)

    # Trust score: inverse of fake confidence, scaled 0-100
    trust_score = round((1.0 - confidence) * 100, 1)

    if confidence >= 0.65:
        verdict = "fake"
    elif confidence >= 0.35:
        verdict = "uncertain"
    else:
        verdict = "real"

    # ── Forensic findings ─────────────────────────────────────────────────────
    findings = []

    if ela["suspicious"]:
        findings.append({
            "indicator": "Compression Anomaly (ELA)",
            "severity": "high",
            "detail": f"ELA residual mean={ela['score']:.2f}, σ={ela['std']:.2f}. "
                      f"Localised high-residual regions suggest post-capture editing.",
            "score": round(min(ela["score"] / 20.0, 1.0), 3),
        })

    if noise["suspicious"]:
        findings.append({
            "indicator": "Noise Inconsistency",
            "severity": "high",
            "detail": f"Block noise variance CV={noise['variance_cv']:.3f}. "
                      f"Heterogeneous noise distribution indicates image compositing.",
            "score": round(min(noise["variance_cv"], 1.0), 3),
        })

    if freq["suspicious"]:
        findings.append({
            "indicator": "GAN Frequency Artifacts",
            "severity": "critical",
            "detail": f"Spectral peak ratio={freq['peak_ratio']:.2f}. "
                      f"Periodic checkerboard patterns in frequency domain — characteristic of GAN upsampling.",
            "score": round(min(freq["peak_ratio"] / 8.0, 1.0), 3),
        })

    if ghost["suspicious"]:
        findings.append({
            "indicator": "JPEG Ghost / Double Compression",
            "severity": "medium",
            "detail": f"Ghost score σ={ghost['ghost_score']:.2f}. "
                      f"Inconsistent JPEG compression history detected across image regions.",
            "score": round(min(ghost["ghost_score"] / 15.0, 1.0), 3),
        })

    if texture["suspicious"]:
        findings.append({
            "indicator": "Texture Inconsistency",
            "severity": "medium",
            "detail": f"Texture CV={texture['texture_cv']:.3f}. "
                      f"Abrupt texture discontinuities between image patches suggest splicing.",
            "score": round(min(texture["texture_cv"], 1.0), 3),
        })

    if lighting["suspicious"]:
        findings.append({
            "indicator": "Lighting Mismatch",
            "severity": "medium",
            "detail": f"Illumination gradient angle σ={lighting['angle_std']:.3f} rad. "
                      f"Inconsistent light source direction across image quadrants.",
            "score": round(min(lighting["angle_std"] / math.pi, 1.0), 3),
        })

    if compression["suspicious"]:
        findings.append({
            "indicator": "Block Boundary Artifacts",
            "severity": "low",
            "detail": f"Boundary/interior ratio={compression['ratio']:.4f}. "
                      f"Elevated DCT block boundary discontinuities suggest re-encoding.",
            "score": round(min(compression["ratio"] * 5, 1.0), 3),
        })

    # Sort by severity
    sev_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    findings.sort(key=lambda x: sev_order.get(x["severity"], 9))

    return {
        "verdict": verdict,
        "confidence": confidence,
        "trust_score": trust_score,
        "flag_count": flag_count,
        "forensic_findings": findings,
        "heatmap_path": heatmap_path,
        "raw": {
            "ela_score": ela["score"],
            "ela_std": ela["std"],
            "noise_cv": noise["variance_cv"],
            "freq_peak_ratio": freq["peak_ratio"],
            "ghost_score": ghost["ghost_score"],
            "texture_cv": texture["texture_cv"],
            "lighting_angle_std": lighting["angle_std"],
            "compression_ratio": compression["ratio"],
        },
    }
