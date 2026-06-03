"""
Audio voice-clone / synthetic speech forensics engine.
CPU-only — uses librosa, numpy, scipy. No heavy ML models required.

Checks:
  1. MFCC feature consistency  — synthetic voices show unnatural MFCC variance
  2. Spectral centroid anomaly — TTS/VC models produce flat spectral profiles
  3. Pitch (F0) consistency    — cloned voices have unnaturally stable pitch
  4. Background noise analysis — AI audio lacks natural room noise
  5. Reverberation anomaly     — TTS output is typically dry / over-processed
  6. Compression artifact score— re-encoded audio shows codec fingerprints
  7. Spectral flux              — measures frame-to-frame spectral change rate
  8. Zero-crossing rate        — synthetic speech has abnormal ZCR patterns
"""

from __future__ import annotations

import os
import math
import json
import logging
import warnings
from typing import Any

import numpy as np
from scipy import signal, stats

warnings.filterwarnings("ignore")
logger = logging.getLogger(__name__)

# ── constants ─────────────────────────────────────────────────────────────────
SR_TARGET   = 22050   # resample target
N_MFCC      = 20
HOP_LENGTH  = 512
N_FFT       = 2048
FRAME_LEN   = 2048


# ── safe librosa loader ───────────────────────────────────────────────────────

def _load_audio(path: str) -> tuple[np.ndarray, int]:
    """Load audio with librosa, fall back to scipy if format unsupported."""
    import librosa  # type: ignore
    try:
        y, sr = librosa.load(path, sr=SR_TARGET, mono=True, duration=120.0)
        return y, sr
    except Exception:
        # scipy fallback for WAV
        from scipy.io import wavfile
        sr, data = wavfile.read(path)
        if data.ndim > 1:
            data = data.mean(axis=1)
        data = data.astype(np.float32)
        if data.max() > 1.0:
            data /= 32768.0
        import librosa
        y = librosa.resample(data, orig_sr=sr, target_sr=SR_TARGET)
        return y, SR_TARGET


# ── 1. MFCC consistency ───────────────────────────────────────────────────────

def mfcc_analysis(y: np.ndarray, sr: int) -> dict[str, Any]:
    """
    Compute MFCCs and measure temporal variance.
    Synthetic voices show unnaturally low or high MFCC delta variance.
    """
    import librosa
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC,
                                  n_fft=N_FFT, hop_length=HOP_LENGTH)
    mfcc_delta = librosa.feature.delta(mfcc)

    # Per-coefficient variance across time
    coeff_vars = mfcc.var(axis=1).tolist()
    delta_vars = mfcc_delta.var(axis=1).tolist()

    mean_var   = float(np.mean(coeff_vars))
    delta_mean = float(np.mean(delta_vars))
    cv_of_vars = float(np.std(coeff_vars) / (mean_var + 1e-8))

    # Synthetic: very low delta variance (monotone) or very high (unstable)
    suspicious = delta_mean < 0.8 or delta_mean > 18.0 or cv_of_vars < 0.25

    # Build spectrogram data for frontend (downsample to 80 time steps × 20 coeffs)
    n_frames = mfcc.shape[1]
    step = max(1, n_frames // 80)
    spec_data = mfcc[:, ::step].T.tolist()  # shape: [time, n_mfcc]

    return {
        "mean_var": round(mean_var, 4),
        "delta_mean": round(delta_mean, 4),
        "cv_of_vars": round(cv_of_vars, 4),
        "coeff_vars": [round(v, 3) for v in coeff_vars],
        "suspicious": suspicious,
        "spectrogram_data": spec_data,
        "mfcc_matrix": mfcc,
    }


# ── 2. Spectral centroid anomaly ──────────────────────────────────────────────

def spectral_analysis(y: np.ndarray, sr: int) -> dict[str, Any]:
    """
    Spectral centroid, bandwidth, and rolloff.
    TTS/VC models produce unnaturally flat or narrow spectral profiles.
    """
    import librosa
    centroid  = librosa.feature.spectral_centroid(y=y, sr=sr, n_fft=N_FFT, hop_length=HOP_LENGTH)[0]
    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr, n_fft=N_FFT, hop_length=HOP_LENGTH)[0]
    rolloff   = librosa.feature.spectral_rolloff(y=y, sr=sr, n_fft=N_FFT, hop_length=HOP_LENGTH)[0]

    centroid_cv  = float(np.std(centroid)  / (np.mean(centroid)  + 1e-8))
    bandwidth_cv = float(np.std(bandwidth) / (np.mean(bandwidth) + 1e-8))
    rolloff_cv   = float(np.std(rolloff)   / (np.mean(rolloff)   + 1e-8))

    # Suspicious: unnaturally flat centroid or bandwidth
    suspicious = centroid_cv < 0.12 or bandwidth_cv < 0.10

    # Waveform envelope for frontend (downsample to 200 points)
    n = len(y)
    step = max(1, n // 200)
    waveform = [round(float(v), 4) for v in y[::step]]

    return {
        "centroid_mean": round(float(centroid.mean()), 2),
        "centroid_cv": round(centroid_cv, 4),
        "bandwidth_cv": round(bandwidth_cv, 4),
        "rolloff_cv": round(rolloff_cv, 4),
        "suspicious": suspicious,
        "waveform": waveform,
        "centroid_series": [round(float(v), 1) for v in centroid[::max(1, len(centroid)//100)]],
    }


# ── 3. Pitch (F0) consistency ─────────────────────────────────────────────────

def pitch_analysis(y: np.ndarray, sr: int) -> dict[str, Any]:
    """
    Extract fundamental frequency (F0) using autocorrelation.
    Cloned voices have unnaturally stable or quantised pitch trajectories.
    """
    import librosa
    # Use pyin for robust F0 estimation
    try:
        f0, voiced_flag, _ = librosa.pyin(
            y, fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C7"),
            sr=sr, hop_length=HOP_LENGTH,
        )
    except Exception:
        f0 = np.zeros(len(y) // HOP_LENGTH)
        voiced_flag = np.zeros_like(f0, dtype=bool)

    voiced_f0 = f0[voiced_flag & ~np.isnan(f0)]
    if len(voiced_f0) < 10:
        return {
            "pitch_cv": 0.0, "pitch_mean": 0.0, "voiced_ratio": 0.0,
            "suspicious": False, "pitch_series": [],
        }

    pitch_cv    = float(np.std(voiced_f0) / (np.mean(voiced_f0) + 1e-8))
    voiced_ratio = float(voiced_flag.sum() / max(len(voiced_flag), 1))

    # Suspicious: very low CV (robotic monotone) or very high (unstable)
    suspicious = pitch_cv < 0.05 or pitch_cv > 0.55

    pitch_series = [round(float(v), 2) if not math.isnan(v) else 0.0
                    for v in f0[::max(1, len(f0)//100)]]

    return {
        "pitch_cv": round(pitch_cv, 4),
        "pitch_mean": round(float(voiced_f0.mean()), 2),
        "voiced_ratio": round(voiced_ratio, 4),
        "suspicious": suspicious,
        "pitch_series": pitch_series,
    }


# ── 4. Background noise analysis ─────────────────────────────────────────────

def noise_analysis(y: np.ndarray, sr: int) -> dict[str, Any]:
    """
    Estimate SNR and noise floor consistency.
    AI-generated audio typically has an unnaturally clean noise floor
    or shows abrupt noise level changes.
    """
    import librosa
    # Split into voiced/unvoiced using RMS energy
    rms = librosa.feature.rms(y=y, frame_length=FRAME_LEN, hop_length=HOP_LENGTH)[0]
    rms_db = librosa.amplitude_to_db(rms + 1e-8)

    # Noise floor = bottom 10th percentile of RMS
    noise_floor = float(np.percentile(rms_db, 10))
    signal_level = float(np.percentile(rms_db, 90))
    snr = signal_level - noise_floor

    # Noise consistency: CV of the bottom-quartile frames
    quiet_frames = rms_db[rms_db < np.percentile(rms_db, 25)]
    noise_cv = float(np.std(quiet_frames) / (abs(np.mean(quiet_frames)) + 1e-8)) if len(quiet_frames) > 5 else 0.0

    # Suspicious: very high SNR (too clean) or very low noise CV (static noise floor)
    suspicious = snr > 55.0 or noise_cv < 0.02

    return {
        "snr_db": round(snr, 2),
        "noise_floor_db": round(noise_floor, 2),
        "noise_cv": round(noise_cv, 4),
        "suspicious": suspicious,
        "rms_series": [round(float(v), 2) for v in rms_db[::max(1, len(rms_db)//100)]],
    }


# ── 5. Reverberation anomaly ──────────────────────────────────────────────────

def reverb_analysis(y: np.ndarray, sr: int) -> dict[str, Any]:
    """
    Estimate RT60-like decay using energy envelope analysis.
    TTS output is typically dry; over-processed clones show unnatural reverb.
    """
    # Compute energy envelope
    frame_size = int(sr * 0.02)  # 20ms frames
    hop = frame_size // 2
    n_frames = (len(y) - frame_size) // hop
    energies = []
    for i in range(n_frames):
        frame = y[i * hop: i * hop + frame_size]
        energies.append(float(np.sum(frame ** 2)))

    if not energies:
        return {"decay_rate": 0.0, "tail_ratio": 0.0, "suspicious": False}

    energies = np.array(energies)
    peak_idx = int(np.argmax(energies))

    # Measure decay after peak
    if peak_idx < len(energies) - 5:
        tail = energies[peak_idx:]
        if tail.max() > 0:
            tail_norm = tail / (tail.max() + 1e-8)
            # Find -60dB point (energy ratio 1e-6)
            below = np.where(tail_norm < 1e-3)[0]
            decay_frames = int(below[0]) if len(below) > 0 else len(tail)
            decay_rate = float(decay_frames / (sr / hop))  # seconds
        else:
            decay_rate = 0.0
    else:
        decay_rate = 0.0

    # Tail energy ratio (energy after 80% of signal vs total)
    split = int(len(energies) * 0.8)
    tail_ratio = float(energies[split:].sum() / (energies.sum() + 1e-8))

    # Suspicious: very short decay (dry TTS) or very long (over-reverbed)
    suspicious = decay_rate < 0.05 or decay_rate > 2.5 or tail_ratio < 0.01

    return {
        "decay_rate": round(decay_rate, 4),
        "tail_ratio": round(tail_ratio, 4),
        "suspicious": suspicious,
    }


# ── 6. Compression artifact score ────────────────────────────────────────────

def compression_analysis(y: np.ndarray, sr: int) -> dict[str, Any]:
    """
    Detect codec compression artifacts via high-frequency energy ratio.
    MP3/AAC compression removes high-frequency content; re-encoded clones
    show characteristic spectral holes.
    """
    import librosa
    stft = np.abs(librosa.stft(y, n_fft=N_FFT, hop_length=HOP_LENGTH))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=N_FFT)

    # Split into low (<4kHz), mid (4-8kHz), high (>8kHz) bands
    low_mask  = freqs < 4000
    mid_mask  = (freqs >= 4000) & (freqs < 8000)
    high_mask = freqs >= 8000

    low_energy  = float(stft[low_mask].mean())
    mid_energy  = float(stft[mid_mask].mean())
    high_energy = float(stft[high_mask].mean())
    total       = low_energy + mid_energy + high_energy + 1e-8

    high_ratio = high_energy / total
    mid_ratio  = mid_energy / total

    # Suspicious: very low high-frequency content (heavy compression)
    suspicious = high_ratio < 0.04 or (mid_ratio < 0.08 and high_ratio < 0.06)

    return {
        "high_ratio": round(high_ratio, 4),
        "mid_ratio": round(mid_ratio, 4),
        "low_ratio": round(low_energy / total, 4),
        "suspicious": suspicious,
    }


# ── 7. Spectral flux ──────────────────────────────────────────────────────────

def spectral_flux_analysis(y: np.ndarray, sr: int) -> dict[str, Any]:
    """
    Spectral flux measures frame-to-frame spectral change.
    Synthetic speech shows unnaturally smooth or erratic flux patterns.
    """
    import librosa
    stft = np.abs(librosa.stft(y, n_fft=N_FFT, hop_length=HOP_LENGTH))
    flux = np.sqrt(np.sum(np.diff(stft, axis=1) ** 2, axis=0))

    flux_mean = float(flux.mean())
    flux_cv   = float(flux.std() / (flux_mean + 1e-8))

    suspicious = flux_cv < 0.4 or flux_cv > 3.5

    return {
        "flux_mean": round(flux_mean, 4),
        "flux_cv": round(flux_cv, 4),
        "suspicious": suspicious,
        "flux_series": [round(float(v), 3) for v in flux[::max(1, len(flux)//100)]],
    }


# ── 8. Zero-crossing rate ─────────────────────────────────────────────────────

def zcr_analysis(y: np.ndarray, sr: int) -> dict[str, Any]:
    """
    Zero-crossing rate is a proxy for noisiness / voicing.
    Synthetic speech has abnormally uniform ZCR.
    """
    import librosa
    zcr = librosa.feature.zero_crossing_rate(y, frame_length=FRAME_LEN, hop_length=HOP_LENGTH)[0]
    zcr_mean = float(zcr.mean())
    zcr_cv   = float(zcr.std() / (zcr_mean + 1e-8))

    suspicious = zcr_cv < 0.25

    return {
        "zcr_mean": round(zcr_mean, 4),
        "zcr_cv": round(zcr_cv, 4),
        "suspicious": suspicious,
    }


# ── Master analysis ───────────────────────────────────────────────────────────

def run_audio_analysis(audio_path: str) -> dict[str, Any]:
    """
    Full audio forensic pipeline. Returns structured result dict.
    """
    import librosa

    y, sr = _load_audio(audio_path)
    duration = float(len(y) / sr)

    mfcc    = mfcc_analysis(y, sr)
    spectral = spectral_analysis(y, sr)
    pitch   = pitch_analysis(y, sr)
    noise   = noise_analysis(y, sr)
    reverb  = reverb_analysis(y, sr)
    comp    = compression_analysis(y, sr)
    flux    = spectral_flux_analysis(y, sr)
    zcr     = zcr_analysis(y, sr)

    # ── Flags & weighted confidence ───────────────────────────────────────────
    flags = [
        mfcc["suspicious"],
        spectral["suspicious"],
        pitch["suspicious"],
        noise["suspicious"],
        reverb["suspicious"],
        comp["suspicious"],
        flux["suspicious"],
        zcr["suspicious"],
    ]
    weights = [0.22, 0.16, 0.20, 0.14, 0.10, 0.08, 0.06, 0.04]
    flag_count = sum(flags)
    raw_conf = sum(w for w, f in zip(weights, flags) if f)
    confidence = round(min(raw_conf + 0.04 * flag_count, 0.99), 4)
    trust_score = round((1.0 - confidence) * 100, 1)
    voice_clone_probability = round(confidence, 4)

    if confidence >= 0.62:
        verdict = "fake"
    elif confidence >= 0.32:
        verdict = "uncertain"
    else:
        verdict = "real"

    # ── Forensic findings ─────────────────────────────────────────────────────
    sev_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    findings: list[dict] = []

    if pitch["suspicious"]:
        cv = pitch["pitch_cv"]
        findings.append({
            "indicator": "Pitch Consistency Anomaly",
            "severity": "critical",
            "detail": (
                f"F0 coefficient of variation={cv:.4f}. "
                + ("Unnaturally stable pitch trajectory — characteristic of TTS/VC synthesis."
                   if cv < 0.05 else
                   "Erratic pitch variation — may indicate voice conversion artefacts.")
            ),
            "score": round(min(abs(cv - 0.15) / 0.15, 1.0), 3),
        })

    if mfcc["suspicious"]:
        findings.append({
            "indicator": "MFCC Feature Anomaly",
            "severity": "high",
            "detail": (
                f"MFCC delta mean={mfcc['delta_mean']:.3f}, CV of variances={mfcc['cv_of_vars']:.3f}. "
                "Mel-frequency cepstral coefficients show unnatural temporal dynamics "
                "inconsistent with organic human speech production."
            ),
            "score": round(min(abs(mfcc["delta_mean"] - 5.0) / 10.0, 1.0), 3),
        })

    if noise["suspicious"]:
        findings.append({
            "indicator": "Background Noise Mismatch",
            "severity": "high",
            "detail": (
                f"SNR={noise['snr_db']:.1f} dB, noise CV={noise['noise_cv']:.4f}. "
                + ("Unnaturally high SNR — AI-generated audio lacks organic room noise."
                   if noise["snr_db"] > 55 else
                   "Suspiciously uniform noise floor — may indicate synthetic noise injection.")
            ),
            "score": round(min(noise["snr_db"] / 80.0, 1.0), 3),
        })

    if spectral["suspicious"]:
        findings.append({
            "indicator": "Spectral Profile Anomaly",
            "severity": "medium",
            "detail": (
                f"Centroid CV={spectral['centroid_cv']:.4f}, bandwidth CV={spectral['bandwidth_cv']:.4f}. "
                "Unnaturally flat spectral centroid and bandwidth — TTS models produce "
                "overly consistent spectral profiles compared to natural speech."
            ),
            "score": round(min((0.15 - min(spectral["centroid_cv"], 0.15)) / 0.15, 1.0), 3),
        })

    if reverb["suspicious"]:
        findings.append({
            "indicator": "Reverberation Anomaly",
            "severity": "medium",
            "detail": (
                f"Decay rate={reverb['decay_rate']:.3f}s, tail ratio={reverb['tail_ratio']:.4f}. "
                + ("Abnormally dry signal — TTS output typically lacks natural room acoustics."
                   if reverb["decay_rate"] < 0.05 else
                   "Excessive reverberation tail — may indicate post-processing artefacts.")
            ),
            "score": round(min(abs(reverb["decay_rate"] - 0.3) / 0.5, 1.0), 3),
        })

    if comp["suspicious"]:
        findings.append({
            "indicator": "Compression Artifacts",
            "severity": "medium",
            "detail": (
                f"High-freq ratio={comp['high_ratio']:.4f}, mid-freq ratio={comp['mid_ratio']:.4f}. "
                "Spectral holes in high-frequency bands indicate heavy codec compression "
                "or re-encoding — common in voice-cloned audio distribution."
            ),
            "score": round(min((0.06 - min(comp["high_ratio"], 0.06)) / 0.06, 1.0), 3),
        })

    if flux["suspicious"]:
        findings.append({
            "indicator": "Spectral Flux Irregularity",
            "severity": "low",
            "detail": (
                f"Flux CV={flux['flux_cv']:.4f}. "
                + ("Unnaturally smooth spectral transitions — synthetic speech lacks "
                   "the micro-variations of natural articulation."
                   if flux["flux_cv"] < 0.4 else
                   "Erratic spectral flux — may indicate frame-level voice conversion artefacts.")
            ),
            "score": round(min(abs(flux["flux_cv"] - 1.0) / 2.0, 1.0), 3),
        })

    if zcr["suspicious"]:
        findings.append({
            "indicator": "Zero-Crossing Rate Anomaly",
            "severity": "low",
            "detail": (
                f"ZCR CV={zcr['zcr_cv']:.4f}. "
                "Abnormally uniform zero-crossing rate across frames — "
                "natural speech shows high ZCR variability between voiced and unvoiced segments."
            ),
            "score": round(min((0.25 - min(zcr["zcr_cv"], 0.25)) / 0.25, 1.0), 3),
        })

    findings.sort(key=lambda x: sev_order.get(x["severity"], 9))

    # ── Spectrogram for frontend ──────────────────────────────────────────────
    # Mel spectrogram (80 mel bands × 100 time steps), normalised 0-1
    mel_spec = librosa.feature.melspectrogram(
        y=y, sr=sr, n_mels=80, n_fft=N_FFT, hop_length=HOP_LENGTH
    )
    mel_db = librosa.power_to_db(mel_spec, ref=np.max)
    # Normalise to 0-1
    mel_norm = (mel_db - mel_db.min()) / (mel_db.max() - mel_db.min() + 1e-8)
    # Downsample time axis to 100 steps
    n_t = mel_norm.shape[1]
    step = max(1, n_t // 100)
    mel_down = mel_norm[:, ::step].tolist()  # [80, ≤100]

    return {
        "verdict": verdict,
        "confidence": confidence,
        "trust_score": trust_score,
        "voice_clone_probability": voice_clone_probability,
        "flag_count": flag_count,
        "duration_seconds": round(duration, 3),
        "sample_rate": sr,
        "forensic_findings": findings,
        "spectrogram": mel_down,
        "waveform": spectral["waveform"],
        "pitch_series": pitch["pitch_series"],
        "flux_series": flux["flux_series"],
        "rms_series": noise["rms_series"],
        "raw": {
            "mfcc_delta_mean": mfcc["delta_mean"],
            "mfcc_cv": mfcc["cv_of_vars"],
            "centroid_cv": spectral["centroid_cv"],
            "bandwidth_cv": spectral["bandwidth_cv"],
            "pitch_cv": pitch["pitch_cv"],
            "pitch_mean": pitch["pitch_mean"],
            "voiced_ratio": pitch["voiced_ratio"],
            "snr_db": noise["snr_db"],
            "noise_cv": noise["noise_cv"],
            "decay_rate": reverb["decay_rate"],
            "high_freq_ratio": comp["high_ratio"],
            "flux_cv": flux["flux_cv"],
            "zcr_cv": zcr["zcr_cv"],
        },
    }
