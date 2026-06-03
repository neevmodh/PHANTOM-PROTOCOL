<div align="center">

<img src="https://img.shields.io/badge/ISAFE-Forensic%20Engine-00d4ff?style=for-the-badge&logo=shield&logoColor=white" alt="ISAFE" />

# PHANTOM PROTOCOL — ISAFE
### Intelligent Synthetic Authenticity & Forensic Engine

> **Enterprise-grade AI-powered deepfake and synthetic media detection platform.**
> Detect manipulated images, deepfake videos, cloned voices, AI-generated documents, and phishing URLs — all in one forensic console.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Groq](https://img.shields.io/badge/Groq-LLaMA3-F55036?style=flat-square)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## What is ISAFE?

ISAFE is a full-stack forensic platform that analyzes five categories of digital media for signs of synthetic generation, manipulation, or malicious intent. Every scan produces a **trust score**, a **verdict**, detailed **forensic findings**, and a **human-readable AI explanation** powered by Groq LLaMA 3 — all stored as evidence and exportable as a PDF/JSON report.

No heavy ML model weights required. All forensic engines run on **CPU only** using signal processing, statistical analysis, and heuristic pattern matching.

---

## Features

| Feature | Description |
|---|---|
| 🖼️ **Image Detection** | ELA, noise variance, FFT frequency artifacts, JPEG ghost, texture inconsistency, lighting mismatch, compression analysis |
| 🎬 **Video Detection** | Frame extraction, optical flow, eye-blink consistency, lip-sync mismatch, head movement, GAN frequency artifacts |
| 🎙️ **Audio Detection** | MFCC consistency, pitch (F0) stability, spectral centroid, background noise SNR, reverberation, spectral flux, ZCR |
| 📄 **Document Detection** | OCR consistency, metadata mismatch, formatting anomalies, semantic coherence, suspicious structure analysis |
| 🔗 **URL Detection** | 12-check phishing/threat engine: HTTPS, IP detection, TLD reputation, brand impersonation, homoglyph, open redirect, entropy |
| 🤖 **AI Explanation** | Groq LLaMA 3 8B generates human-readable forensic briefs with threat reasoning and severity assessment |
| 📊 **Analytics Dashboard** | Trends, breakdown by media type, risk distribution, recent scans, activity timeline |
| 📋 **Reports** | Export forensic reports as PDF or JSON with full evidence trail |
| 💾 **Evidence Storage** | All scans persisted to CSV with full metadata |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 · TypeScript · Tailwind CSS · Framer Motion · Recharts · Lucide |
| **Backend** | FastAPI · Python 3.11+ · Pydantic v2 · Uvicorn |
| **Image Forensics** | Pillow · NumPy · SciPy |
| **Audio Forensics** | librosa · soundfile · SciPy |
| **Video Forensics** | OpenCV (headless) · NumPy · SciPy |
| **Document Parsing** | pdfplumber · pytesseract · Pillow |
| **URL Analysis** | stdlib (urllib, socket, ipaddress, re) |
| **AI Explanation** | Groq API — LLaMA 3 8B (8192 ctx) |
| **HTTP Client** | httpx (async) |
| **Storage** | CSV flat files |

---

## Project Structure

```
isafe/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Pydantic settings + path resolution
│   ├── requirements.txt
│   ├── .env.example               # Environment template
│   ├── routes/                    # API route handlers
│   │   ├── image.py
│   │   ├── video.py
│   │   ├── audio.py
│   │   ├── document.py
│   │   ├── url.py
│   │   ├── analytics.py
│   │   └── reports.py
│   ├── services/                  # Business logic + CSV persistence
│   │   ├── base_service.py        # Shared CSV read/write
│   │   ├── image_service.py
│   │   ├── video_service.py
│   │   ├── audio_service.py
│   │   ├── document_service.py
│   │   ├── url_service.py
│   │   ├── analytics_service.py
│   │   ├── reports_service.py
│   │   └── explanation_service.py # Groq structured JSON reports
│   ├── utils/                     # Forensic engines
│   │   ├── image_forensics.py     # ELA, noise, FFT, ghost, texture, lighting
│   │   ├── video_forensics.py     # Frames, optical flow, blink, lip-sync
│   │   ├── audio_forensics.py     # MFCC, pitch, spectral, noise, reverb, ZCR
│   │   ├── url_forensics.py       # 12-check phishing/threat engine
│   │   ├── groq_explainer.py      # Groq prompt builders + fallback
│   │   ├── file_utils.py          # MIME validation + async file save
│   │   ├── csv_utils.py           # CSV helpers
│   │   └── response_utils.py      # Standardized response builders
│   ├── uploads/                   # Uploaded files (auto-created)
│   ├── csv_data/                  # Detection records (auto-created)
│   └── reports/                   # Generated reports (auto-created)
│
└── frontend/
    ├── next.config.mjs
    ├── tailwind.config.ts         # Custom cyber dark theme
    ├── package.json
    └── src/
        ├── app/                   # Next.js App Router pages
        │   ├── page.tsx           # Landing page
        │   ├── dashboard/
        │   ├── image-detection/
        │   ├── video-detection/
        │   ├── audio-detection/
        │   ├── document-detection/
        │   ├── url-detection/
        │   ├── analytics/
        │   └── reports/
        ├── components/
        │   ├── layout/            # AppShell, Sidebar, TopBar, PageHeader
        │   ├── audio/             # Spectrogram, VoiceCloneMeter, AudioPlayer
        │   ├── video/             # FrameTimeline, TemporalScorePanel
        │   ├── dashboard/         # Charts, StatCard, ThreatFeed, RecentScans
        │   ├── UploadPanel.tsx
        │   ├── TrustScoreGauge.tsx
        │   ├── HeatmapViewer.tsx
        │   ├── ResultCard.tsx
        │   └── AIExplanationPanel.tsx
        └── lib/
            ├── api.ts             # Typed API client
            ├── types.ts           # Shared TypeScript types
            └── utils.ts           # Utility functions
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- `tesseract-ocr` system dependency (for document OCR)

```bash
# macOS
brew install tesseract

# Ubuntu / Debian
sudo apt install tesseract-ocr

# Windows — download installer from:
# https://github.com/UB-Mannheim/tesseract/wiki
```

---

### 1. Clone the repo

```bash
git clone https://github.com/neevmodh/PHANTOM-PROTOCOL.git
cd PHANTOM-PROTOCOL
```

---

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Open .env and set your GROQ_API_KEY
```

```bash
# Start the backend
uvicorn main:app --reload --port 8000
```

| Endpoint | URL |
|---|---|
| API Base | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Health Check | http://localhost:8000/api/health |

---

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

App is live at **http://localhost:3000**

---

## Environment Variables

### `backend/.env`

```env
APP_NAME=ISAFE
APP_VERSION=1.0.0
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
UPLOAD_DIR=uploads
CSV_DATA_DIR=csv_data
REPORTS_DIR=reports
HEATMAP_DIR=uploads/heatmaps
VIDEO_FRAMES_DIR=uploads/video_frames
MAX_UPLOAD_SIZE_MB=50
GROQ_API_KEY=your_groq_api_key_here
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=ISAFE
NEXT_PUBLIC_APP_VERSION=1.0.0
```

> **Get a Groq API key** → [console.groq.com](https://console.groq.com) → API Keys → Create API Key
>
> The platform works **without a Groq key** — all explanations fall back to deterministic prose generated locally.

---

## Detection Modules

### 🖼️ Image Detection

**Endpoint:** `POST /api/image/analyze-image`

**Pipeline:**

```
Upload image (JPG / PNG / WEBP / GIF)
    │
    ├── Error Level Analysis (ELA)
    │       Re-compress at quality=90, measure residual → tampering indicator
    │
    ├── Noise Variance Analysis
    │       Laplacian filter → 4×4 block noise CV → compositing indicator
    │
    ├── DCT Frequency Artifacts (FFT)
    │       2D FFT → peripheral spectral peak ratio → GAN checkerboard detection
    │
    ├── JPEG Ghost Detection
    │       Multi-quality re-save → minimum diff map → double-compression detection
    │
    ├── Texture Inconsistency
    │       Sobel edge patches → CV across patches → splicing indicator
    │
    ├── Lighting Gradient Analysis
    │       Illumination map → quadrant gradient angles → face/background mismatch
    │
    ├── Compression Artifact Score
    │       DCT 8×8 block boundary ratio → re-encoding indicator
    │
    ├── Composite Heatmap
    │       ELA(45%) + Noise(30%) + Ghost(25%) → false-color PNG
    │
    └── Groq LLaMA 3 Explanation
            Structured forensic brief with severity, findings, trust analysis
```

**Response fields:** `verdict`, `trust_score`, `confidence`, `flag_count`, `forensic_findings`, `heatmap_url`, `image_url`, `explanation`, `processing_time_ms`

---

### 🎬 Video Detection

**Endpoint:** `POST /api/video/analyze-video`

**Pipeline:**

```
Upload video (MP4 / AVI / MOV / WEBM / MKV)
    │
    ├── Frame Extraction (OpenCV)
    │       Up to 30 evenly-spaced frames at 320×180
    │
    ├── Per-Frame Analysis
    │   ├── ELA score per frame
    │   ├── FFT spectral peak ratio per frame
    │   ├── Lighting gradient angle std per frame
    │   └── DCT compression ratio per frame
    │
    ├── Temporal Analysis
    │   ├── Optical Flow (Farneback) → flow CV → temporal discontinuity
    │   ├── Eye-Blink Consistency → luminance CV in eye region
    │   ├── Lip-Sync Mismatch → mouth texture CV
    │   └── Head Movement Anomaly → centroid drift CV
    │
    ├── Suspicious Frame Detection
    │       Frames exceeding ELA mean + 1.5σ threshold flagged
    │
    ├── Frame Thumbnails
    │       First / middle / last + worst suspicious frame saved
    │
    └── Groq LLaMA 3 Explanation
```

**Response fields:** `verdict`, `trust_score`, `confidence`, `frames_analyzed`, `suspicious_frames`, `duration_seconds`, `fps`, `forensic_findings`, `saved_frames`, `frame_timeline`, `explanation`

---

### 🎙️ Audio Detection

**Endpoint:** `POST /api/audio/analyze-audio`

**Pipeline:**

```
Upload audio (MP3 / WAV / OGG / FLAC / M4A / AAC / WEBM)
    │
    ├── MFCC Consistency Analysis
    │       20 mel-freq cepstral coefficients → delta variance → TTS/VC detection
    │
    ├── Spectral Centroid & Bandwidth
    │       CV of centroid/bandwidth → flat profile = TTS indicator
    │
    ├── Pitch (F0) Analysis — pyin algorithm
    │       Voiced F0 coefficient of variation → robotic vs. erratic pitch
    │
    ├── Background Noise / SNR
    │       RMS energy percentiles → SNR dB → too-clean = AI indicator
    │
    ├── Reverberation Analysis
    │       Energy envelope decay rate → dry TTS vs. over-reverbed clone
    │
    ├── Compression Artifacts
    │       STFT band energy ratios → high-freq holes = re-encoding indicator
    │
    ├── Spectral Flux
    │       Frame-to-frame spectral change rate → smooth = synthetic indicator
    │
    ├── Zero-Crossing Rate
    │       ZCR uniformity → synthetic speech lacks natural ZCR variation
    │
    └── Groq LLaMA 3 Explanation
```

**Response fields:** `verdict`, `trust_score`, `confidence`, `voice_clone_probability`, `duration_seconds`, `sample_rate`, `forensic_findings`, `spectrogram`, `waveform`, `pitch_series`, `flux_series`, `rms_series`, `explanation`

---

### 📄 Document Detection

**Endpoint:** `POST /api/document/analyze-document`

**Supported formats:** PDF · DOCX · TXT

**Pipeline:**

```
Upload document
    │
    ├── Text Extraction
    │   ├── PDF   → pdfplumber + pytesseract OCR fallback
    │   ├── DOCX  → zipfile + ElementTree XML parsing
    │   └── TXT   → direct read
    │
    ├── OCR Consistency Check
    │       pdfplumber text vs. pytesseract OCR → overlap score
    │
    ├── Metadata Mismatch Analysis
    │       Author, title, timestamps → generic/mismatched metadata detection
    │
    ├── Formatting Anomalies
    │       Long lines, repeated characters, bullet density, uppercase ratio
    │
    ├── Semantic Consistency
    │       Sentence length variance + unique word ratio → coherence score
    │
    ├── Suspicious Structure
    │       Flat paragraphs, placeholder text, missing section markers
    │
    ├── AI Probability Score
    │       Weighted combination of all signals → 0.0–1.0 probability
    │
    └── ExplanationService (Groq or fallback)
```

**Response fields:** `verdict`, `trust_score`, `confidence`, `ai_generated_probability`, `ocr_consistency`, `metadata_mismatch`, `formatting_anomalies`, `semantic_consistency`, `suspicious_structure`, `forensic_indicators`, `preview_text`, `explanation`

---

### 🔗 URL Detection

**Endpoint:** `POST /api/url/analyze-url`

**Body:** `{ "url": "https://example.com" }`

**Pipeline:**

```
Submit URL
    │
    ├── Static Forensic Analysis (12 checks)
    │   ├──  1. HTTPS / SSL validation
    │   ├──  2. IP-based URL detection
    │   ├──  3. Suspicious TLD (.tk, .ml, .xyz, .top ...)
    │   ├──  4. Phishing keyword density (50+ keywords)
    │   ├──  5. Brand impersonation + typosquatting (Levenshtein distance=1)
    │   ├──  6. Excessive subdomain depth (≥3 levels)
    │   ├──  7. Domain entropy + length anomaly (DGA detection)
    │   ├──  8. Suspicious path patterns (wp-admin, .env, base64 ...)
    │   ├──  9. URL shortener detection (bit.ly, tinyurl ...)
    │   ├── 10. Homoglyph / punycode attack
    │   ├── 11. Open redirect parameters
    │   └── 12. Known malicious pattern signatures
    │
    ├── Live HTTP Probe (httpx async)
    │       HEAD → GET fallback → redirect chain → SSL handshake validation
    │
    ├── Score Merging
    │       Static score + live probe adjustments → final trust score
    │
    └── ExplanationService (Groq or fallback)
```

**Response fields:** `verdict`, `risk_level`, `trust_score`, `confidence_score`, `ssl_valid`, `redirect_count`, `final_url`, `domain_reputation`, `ssl_validation`, `threat_indicators`, `forensic_reasons`, `checks_summary`, `domain_info`, `explanation`

---

## Scoring System

Every module produces the same core scores:

| Score | Range | Meaning |
|---|---|---|
| `trust_score` | 0 – 100 | Higher = more trustworthy. `(1 - confidence) × 100` |
| `confidence` | 0.0 – 1.0 | Weighted sum of triggered forensic flags |
| `verdict` | `real` / `uncertain` / `fake` | Derived from trust score thresholds |
| `flag_count` | 0 – N | Number of individual forensic checks that triggered |

**Verdict thresholds:**

| Trust Score | Verdict |
|---|---|
| ≥ 70 | `real` |
| 40 – 69 | `uncertain` |
| < 40 | `fake` |

---

## API Reference

### Detection Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/image/analyze-image` | Analyze image for deepfake/manipulation |
| `POST` | `/api/video/analyze-video` | Analyze video for deepfake content |
| `POST` | `/api/audio/analyze-audio` | Analyze audio for voice cloning |
| `POST` | `/api/document/analyze-document` | Analyze document for AI generation |
| `POST` | `/api/url/analyze-url` | Analyze URL for phishing/threats |

### History Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/image/history` | All image scan records |
| `GET` | `/api/video/history` | All video scan records |
| `GET` | `/api/audio/history` | All audio scan records |
| `GET` | `/api/document/history` | All document scan records |
| `GET` | `/api/url/history` | All URL scan records |
| `GET` | `/api/{type}/history/{id}` | Single record by ID |

### Analytics Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/dashboard` | Full dashboard payload |
| `GET` | `/api/analytics/summary` | Overall detection statistics |
| `GET` | `/api/analytics/trends` | Detection trends over 30 days |
| `GET` | `/api/analytics/breakdown` | Breakdown by media type |
| `GET` | `/api/analytics/risk-distribution` | Trust score risk buckets |
| `GET` | `/api/analytics/content-types` | Per-type stats with flag rates |
| `GET` | `/api/analytics/activity?days=14` | Activity timeline |
| `GET` | `/api/analytics/recent?limit=10` | Most recent detections |

### Reports Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports/` | List all generated reports |
| `POST` | `/api/reports/generate/{id}?media_type=image` | Generate report for a record |
| `GET` | `/api/reports/download/{id}?format=pdf` | Download PDF or JSON report |

---

## Frontend Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Product overview + module links |
| Dashboard | `/dashboard` | Live stats, charts, recent scans |
| Image Detection | `/image-detection` | Upload + heatmap + findings + explanation |
| Video Detection | `/video-detection` | Upload + frame timeline + temporal analysis |
| Audio Detection | `/audio-detection` | Upload + spectrogram + voice clone meter |
| Document Detection | `/document-detection` | Upload + OCR + metadata + AI probability |
| URL Detection | `/url-detection` | URL input + 12-check results + domain info |
| Analytics | `/analytics` | Trend charts, breakdowns, risk distribution |
| Reports | `/reports` | List, generate, download forensic reports |

---

## UI Theme

Dark cybersecurity glassmorphism design system:

- **Background:** `#050a14` deep navy
- **Surface:** `#0a1628` dark blue
- **Accent:** `#00d4ff` cyan neon
- **Safe:** `#00ff88` green neon
- **Danger:** `#ff3366` red neon
- **Warning:** `#ffcc00` yellow
- **Purple:** `#9945ff`

Custom Tailwind tokens: `cyber-bg`, `cyber-surface`, `cyber-card`, `cyber-border`, `cyber-accent`, `cyber-green`, `cyber-red`, `cyber-yellow`, `cyber-purple`, `cyber-text`, `cyber-muted`

Animations: scan-line sweep, glow pulse, float, animated trust score gauge, Framer Motion page transitions.

---

## Data Storage

All detection results are persisted as CSV files in `backend/csv_data/`:

| File | Contents |
|---|---|
| `image_detections.csv` | id, filename, trust_score, verdict, confidence, ELA/noise/FFT metrics, heatmap_path, explanation |
| `video_detections.csv` | id, filename, trust_score, verdict, frames_analyzed, suspicious_frames, flow_cv, blink_cv, explanation |
| `audio_detections.csv` | id, filename, trust_score, verdict, voice_clone_probability, MFCC/pitch/spectral metrics, explanation |
| `document_detections.csv` | id, filename, trust_score, verdict, ai_generated_probability, ocr_consistency, semantic_consistency |
| `url_detections.csv` | id, url, trust_score, risk_level, verdict, ssl_valid, redirect_count, threat_indicators |

Generated reports saved to `backend/reports/` as `report_{id}.json` and `report_{id}.pdf`.

---

## Models & Algorithms Used

ISAFE uses **no pretrained neural network weights**. Every detection engine is built entirely from classical signal processing, statistical analysis, and mathematical heuristics — making it fully CPU-portable with zero model download overhead. Below is a complete catalog of every algorithm, technique, and reference dataset that informed the thresholds.

---

### 🖼️ Image Forensics Algorithms

| Algorithm | Implementation | What It Detects |
|---|---|---|
| **Error Level Analysis (ELA)** | Re-compress at JPEG quality=90, measure pixel-level residual via `ImageChops.difference` | Post-capture editing, splicing, copy-move forgery |
| **Laplacian Noise Variance** | `scipy.ndimage.laplace` → 4×4 block variance CV | Image compositing from multiple sources |
| **2D Fast Fourier Transform (FFT)** | `numpy.fft.fft2` → log-magnitude spectrum → peripheral peak ratio | GAN checkerboard upsampling artifacts (StyleGAN, ProGAN) |
| **JPEG Ghost Detection** | Re-save at qualities [60,70,80,90] → minimum per-pixel difference map std | Double-compression / tampered region detection |
| **Sobel Texture Analysis** | `scipy.ndimage.sobel` edge map → patch-level CV | Splicing boundaries between image regions |
| **Illumination Gradient Analysis** | BT.601 luminance → Gaussian blur → 2×2 quadrant gradient angle std | Face/background lighting mismatch in deepfakes |
| **DCT Block Boundary Score** | 8×8 JPEG block boundary discontinuity ratio | Re-encoding artifacts from image manipulation |
| **Jet-colormap Composite Heatmap** | Weighted blend: ELA(45%) + Noise(30%) + Ghost(25%) → false-color PNG | Visualization of manipulation probability map |

**Scoring weights (confidence):**

| Check | Weight |
|---|---|
| ELA | 0.25 |
| FFT Frequency | 0.20 |
| Noise Variance | 0.15 |
| JPEG Ghost | 0.15 |
| Texture | 0.10 |
| Lighting | 0.10 |
| Compression | 0.05 |

**Detection thresholds:**

| Metric | Suspicious threshold |
|---|---|
| ELA mean residual | > 8.0 px or σ > 12.0 |
| Noise variance CV | > 0.6 |
| FFT peak ratio | > 4.5 |
| Ghost score σ | > 6.0 |
| Texture CV | > 0.55 |
| Lighting angle σ | > 0.8 rad |
| Compression ratio | > 0.15 |

**Reference research:**
- Farid, H. (2009). *Image forgery detection.* IEEE Signal Processing Magazine
- Krawetz, N. (2007). *A picture's worth...* Hacker Factor Solutions (ELA origin)
- Frank, J. et al. (2020). *Leveraging Frequency Analysis for Deep Fake Image Recognition.* ICML

---

### 🎬 Video Forensics Algorithms

| Algorithm | Implementation | What It Detects |
|---|---|---|
| **Frame Extraction** | `cv2.VideoCapture` → `numpy.linspace` evenly-spaced sampling (max 30 frames at 320×180) | Representative temporal sampling |
| **Per-frame ELA** | Same as image ELA, applied to each frame | Frame-level post-processing, face-region compositing |
| **Per-frame FFT** | Same as image FFT, applied to each frame | GAN artifacts in individual frames |
| **Farneback Dense Optical Flow** | `cv2.calcOpticalFlowFarneback` (pyr_scale=0.5, levels=3, winsize=15) → flow magnitude CV | Temporal discontinuities, frame replacement |
| **Eye-Region Luminance Tracking** | Top 15–40% of frame height → mean luminance diff CV across frames | Unnatural blink patterns (absent/too regular) |
| **Mouth-Region Sobel Texture** | Bottom 55–80% of frame height → Sobel edge mean CV across frames | Lip-sync misalignment, AI-generated mouth movement |
| **Head Centroid Movement** | Otsu threshold → `cv2.moments` → inter-frame Euclidean distance CV | Face warping, 3D model misalignment |
| **Per-frame Lighting std** | Same as image lighting, per frame → temporal mean | Inconsistent illumination across frames |
| **Per-frame DCT boundary** | Same as image compression, per frame → temporal mean | Re-encoding artifacts |

**Scoring weights (confidence):**

| Check | Weight |
|---|---|
| FFT frequency artifacts | 0.18 |
| ELA per-frame | 0.18 |
| Optical flow | 0.16 |
| Eye blink | 0.12 |
| Lip-sync | 0.12 |
| Lighting | 0.10 |
| Compression | 0.08 |
| Head movement | 0.06 |

**Detection thresholds:**

| Metric | Suspicious threshold |
|---|---|
| FFT mean peak ratio | > 4.2 |
| ELA mean | > 9.0 or σ > 5.0 |
| Optical flow CV | > 1.2 or mean < 0.3 px/frame |
| Eye luminance CV | < 0.15 (no blinks) or > 3.5 (erratic) |
| Mouth texture CV | < 0.08 or > 2.0 |
| Head movement CV | > 2.5 |
| Lighting mean σ | > 0.75 rad |
| Compression mean ratio | > 0.14 |

**Suspicious frame threshold:** ELA score > mean + 1.5σ across sampled frames

**Reference research:**
- Li, Y. et al. (2018). *In Ictu Oculi: Exposing AI Created Fake Videos by Detecting Eye Blinking.* IEEE WIFS
- Rossler, A. et al. (2019). *FaceForensics++: Learning to Detect Manipulated Facial Images.* ICCV
- Ciftci, U.A. et al. (2020). *FakeCatcher: Detection of Synthetic Portrait Videos using Biological Signals.* IEEE TPAMI

---

### 🎙️ Audio Forensics Algorithms

| Algorithm | Implementation | Library | What It Detects |
|---|---|---|---|
| **MFCC Analysis** | 20 mel-frequency cepstral coefficients, N_FFT=2048, hop=512 → delta variance CV | `librosa.feature.mfcc` + `librosa.feature.delta` | Unnatural temporal dynamics in TTS/VC |
| **Spectral Centroid & Bandwidth** | CV of centroid/bandwidth/rolloff over time | `librosa.feature.spectral_centroid/bandwidth/rolloff` | Flat spectral profiles from TTS models |
| **Pitch (F0) via pYIN** | Probabilistic YIN algorithm, fmin=C2 (65Hz), fmax=C7 (2093Hz) → voiced F0 CV | `librosa.pyin` | Robotic monotone (CV<0.05) or erratic pitch (CV>0.55) |
| **RMS Energy / SNR** | 10th/90th percentile RMS dB → SNR, bottom-quartile noise CV | `librosa.feature.rms` + `librosa.amplitude_to_db` | Unnaturally clean AI audio (SNR>55dB) |
| **Reverberation / RT60 Proxy** | 20ms frame energy envelope → peak-to-noise decay frames | Custom energy envelope analysis | Dry TTS output (decay<0.05s) or over-reverbed clone (>2.5s) |
| **Band Energy Ratio** | STFT → low (<4kHz) / mid (4-8kHz) / high (>8kHz) energy ratio | `librosa.stft` + `librosa.fft_frequencies` | High-freq spectral holes from MP3/AAC re-encoding |
| **Spectral Flux** | Frame-to-frame STFT difference L2 norm → CV | `librosa.stft` + `numpy.diff` | Unnaturally smooth (CV<0.4) or erratic (CV>3.5) transitions |
| **Zero-Crossing Rate** | ZCR uniformity CV across frames | `librosa.feature.zero_crossing_rate` | Synthetic speech lacks natural voiced/unvoiced variability |
| **Mel Spectrogram** | 80 mel bands, power-to-dB, normalized 0-1, downsampled to 100 time steps | `librosa.feature.melspectrogram` | Frontend visualization |

**Audio parameters:**

| Parameter | Value |
|---|---|
| Sample rate target | 22,050 Hz |
| FFT size | 2,048 |
| Hop length | 512 |
| MFCC coefficients | 20 |
| Frame length (RMS/ZCR) | 2,048 |
| Max audio duration | 120 seconds |

**Scoring weights (confidence):**

| Check | Weight |
|---|---|
| MFCC | 0.22 |
| Pitch F0 | 0.20 |
| Spectral centroid | 0.16 |
| Noise/SNR | 0.14 |
| Reverberation | 0.10 |
| Compression | 0.08 |
| Spectral flux | 0.06 |
| ZCR | 0.04 |

**Reference research:**
- Yi, J. et al. (2022). *ADD 2022: the First Audio Deep Synthesis Detection Challenge.* ICASSP
- Reimao, R. & Tzerpos, V. (2019). *For: A Dataset for Synthetic Speech Detection.* IC3D
- de Léon, P.L. et al. (2012). *Synthetic speech detection using MFCC.* Odyssey
- Müller, M. (2015). *Fundamentals of Music Processing* (pYIN/F0 reference)

---

### 📄 Document Forensics Algorithms

| Algorithm | What It Measures | Suspicious Signal |
|---|---|---|
| **OCR Consistency (Jaccard overlap)** | pdfplumber text vs pytesseract OCR token overlap | Score < 0.70 (text/image mismatch) |
| **Metadata Anomaly Scoring** | Author field = generic/tool name, title≠filename, timestamp inversion | Any flag → score 0.2–0.35 |
| **Formatting Anomaly Detection** | Line length > 240 chars, repeated char runs (≥7), bullet density > 35%, uppercase ratio > 22% | Per-flag penalty 0.18–0.25 |
| **Semantic Consistency** | Sentence length std dev + unique word ratio → coherence = 1 − variation − redundancy | Score < 0.72 |
| **Suspicious Structure** | Flat paragraphs with long text, placeholder language, missing section markers, many short tokens | Per-flag penalty 0.15–0.30 |
| **AI Probability Estimator** | Weighted combination: OCR(0.24) + metadata(0.15) + formatting(0.18) + semantic(0.18) + structure(0.17) + base(0.12) | > 0.5 = likely AI-generated |

**Text extraction chain:**

```
PDF  → pdfplumber.extract_text() → pytesseract OCR fallback (per page, 150 DPI)
DOCX → zipfile + ElementTree (word/document.xml namespace parsing)
TXT  → direct UTF-8 read
```

---

### 🔗 URL Forensics Algorithms

| Check | Algorithm / Method | Weight |
|---|---|---|
| HTTPS/SSL | `urlparse` scheme check | 0.08 |
| IP-Based URL | `ipaddress.ip_address()` validation | 0.14 |
| Suspicious TLD | Set membership (30 known-abused TLDs) | 0.08 |
| Phishing Keywords | Substring search across 40+ keywords | 0.12 |
| Brand Impersonation | Subdomain containment + **Levenshtein distance = 1** (25 brands) | 0.16 |
| Subdomain Depth | Count of subdomain levels ≥ 3 | 0.06 |
| Domain Entropy | **Shannon entropy** H(domain) > 3.8 AND length > 20 | 0.06 |
| Path Patterns | Regex match (16 patterns: wp-admin, .env, base64, eval…) | 0.08 |
| URL Shortener | Set membership (17 known shortener domains) | 0.04 |
| Homoglyph/Punycode | Unicode regex `[àáâã…]|xn--` | 0.10 |
| Open Redirect | Query param key membership (16 redirect param names) | 0.04 |
| Malicious Patterns | 6 regex signatures (IP+random path, PHP base64, social engineering…) | 0.14 |

**Live HTTP probe (httpx async):**
- HEAD → GET fallback on 405/501
- Follow redirects → count redirect chain length
- Extract final URL scheme → SSL handshake validation
- Timeout: 5 seconds

**Reference research:**
- Ma, J. et al. (2009). *Identifying Suspicious URLs: An Application of Large-Scale Online Learning.* ICML
- Sahoo, D. et al. (2017). *Malicious URL Detection using Machine Learning: A Survey.* arXiv

---

### 🤖 AI Explanation Model

| Property | Value |
|---|---|
| **Model** | Meta LLaMA 3 8B Instruct |
| **Model ID** | `llama3-8b-8192` |
| **Context window** | 8,192 tokens |
| **Provider** | Groq Cloud API |
| **Temperature** | 0.25 (structured JSON) / 0.3 (prose) |
| **Max tokens** | 300–650 depending on media type |
| **System prompt** | "You are ISAFE, an enterprise-grade explainable AI forensic analyst. Return only valid JSON." |
| **Fallback** | Deterministic template-based prose (no API required) |

**Output schema (structured JSON):**
```json
{
  "human_readable_explanation": "string",
  "threat_reasoning": "string",
  "key_suspicious_findings": [
    { "title": "string", "detail": "string", "severity": "low|medium|high|critical", "confidence": 0.0 }
  ],
  "severity_assessment": { "level": "string", "badge": "string", "summary": "string" },
  "trust_analysis_summary": "string"
}
```

---

### 📦 Python Libraries (Forensic Engines)

| Library | Version | Role |
|---|---|---|
| `Pillow` | ≥ 11.0 | Image loading, ELA re-compression, heatmap rendering |
| `numpy` | ≥ 2.1 | All numerical arrays, FFT, scoring math |
| `scipy` | ≥ 1.14 | Laplacian filter, Sobel, Gaussian blur, ndimage operations |
| `librosa` | ≥ 0.10.2 | MFCC, spectral features, pYIN pitch, mel spectrogram |
| `soundfile` | ≥ 0.12.1 | Audio file decoding |
| `opencv-python-headless` | ≥ 4.10 | Frame extraction, Farneback optical flow, Otsu threshold, moments |
| `pdfplumber` | ≥ 0.11.4 | PDF text and metadata extraction |
| `pytesseract` | ≥ 0.3.13 | OCR fallback for image-based PDFs |
| `httpx` | ≥ 0.27 | Async HTTP probe for URL live validation |
| `groq` | ≥ 0.11 | Groq LLaMA 3 API client |

---

### 🗂️ Reference Datasets (Informed Thresholds & Heuristics)

ISAFE does not load or query any external dataset at runtime. The detection thresholds were designed based on known characteristics documented in the following public datasets and benchmarks:

| Dataset | Type | Used For |
|---|---|---|
| **FaceForensics++** (Rossler et al., 2019) | Video — face manipulation (Deepfakes, FaceSwap, Face2Face, NeuralTextures) | Video ELA, optical flow, and blink detection thresholds |
| **DFDC (DeepFake Detection Challenge)** (Dolhansky et al., 2020) | Video — large-scale deepfake benchmark | Frame sampling strategy and suspicious frame flagging ratio |
| **Celeb-DF** (Li et al., 2020) | Video — high-quality celebrity deepfakes | GAN frequency artifact and lighting inconsistency thresholds |
| **ADD 2022 (Audio Deep Synthesis Detection)** (Yi et al., 2022) | Audio — TTS and voice conversion | MFCC delta variance ranges, pitch CV thresholds, SNR bounds |
| **ASVspoof 2019 / 2021** (Todisco et al.) | Audio — anti-spoofing, synthetic speech | ZCR, spectral flux, and reverberation anomaly thresholds |
| **CASIA Image Tampering Dataset** (Dong et al., 2013) | Image — splicing, copy-move, retouching | ELA score thresholds and noise CV suspicious bounds |
| **Columbia Uncompressed Image Splicing** (Hsu & Chang, 2006) | Image — splicing detection benchmark | JPEG ghost and texture inconsistency baseline values |
| **OpenPhish / PhishTank** (Community) | URL — known phishing URLs | Phishing keyword list, brand impersonation targets, suspicious TLD set |
| **Alexa Top 1M / Tranco List** | URL — legitimate domain characteristics | Normal domain entropy and length distribution baselines |
| **URLhaus (abuse.ch)** | URL — malware distribution URLs | Malicious path pattern signatures and suspicious param keys |

> All thresholds are heuristic approximations derived from published literature and dataset analysis. No dataset files are bundled or required at runtime.

---

## License

MIT License — free to use, modify, and distribute.

---

<div align="center">

Built for **PHANTOM PROTOCOL** · Powered by FastAPI + Next.js + Groq LLaMA 3

</div>
