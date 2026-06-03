// ── Realistic forensic demo data ──────────────────────────────

export const THREAT_ACTIVITY = [
  { time: "09:47", date: "May 19", type: "image", file: "press_release_photo.jpg", verdict: "fake" as const, score: 12, model: "EfficientNet-B4", ms: 847 },
  { time: "09:31", date: "May 19", type: "url", file: "https://secure-banklogin.net/auth", verdict: "fake" as const, score: 8, model: "URLBert", ms: 312 },
  { time: "09:14", date: "May 19", type: "audio", file: "ceo_voice_message.mp3", verdict: "fake" as const, score: 19, model: "RawNet2", ms: 1203 },
  { time: "08:58", date: "May 19", type: "video", file: "interview_clip_final.mp4", verdict: "uncertain" as const, score: 44, model: "TimeSformer", ms: 4821 },
  { time: "08:42", date: "May 19", type: "document", file: "contract_amendment_v3.pdf", verdict: "fake" as const, score: 23, model: "DocFormer", ms: 692 },
  { time: "08:19", date: "May 19", type: "image", file: "passport_scan_KL2948.png", verdict: "fake" as const, score: 7, model: "EfficientNet-B4", ms: 934 },
  { time: "07:55", date: "May 19", type: "audio", file: "earnings_call_excerpt.wav", verdict: "real" as const, score: 91, model: "RawNet2", ms: 1087 },
  { time: "07:33", date: "May 19", type: "image", file: "product_launch_banner.png", verdict: "real" as const, score: 88, model: "EfficientNet-B4", ms: 761 },
  { time: "07:11", date: "May 19", type: "url", file: "https://phish-paypal-verify.ru/login", verdict: "fake" as const, score: 3, model: "URLBert", ms: 289 },
  { time: "06:48", date: "May 19", type: "video", file: "security_footage_cam4.mp4", verdict: "real" as const, score: 82, model: "TimeSformer", ms: 5102 },
];

export const FORENSIC_ALERTS = [
  {
    id: "ALT-2024-0891",
    severity: "critical" as const,
    title: "GAN Face Synthesis Detected",
    detail: "passport_scan_KL2948.png — StyleGAN3 fingerprint identified in frequency domain. Confidence: 97.3%",
    time: "2 min ago",
    type: "image",
  },
  {
    id: "ALT-2024-0890",
    severity: "critical" as const,
    title: "Voice Clone Attack",
    detail: "ceo_voice_message.mp3 — ElevenLabs v2 synthesis pattern matched. Prosody anomaly score: 0.91",
    time: "18 min ago",
    type: "audio",
  },
  {
    id: "ALT-2024-0889",
    severity: "high" as const,
    title: "Phishing URL Cluster",
    detail: "3 URLs share identical TLS fingerprint with known phishing infrastructure (AS48666). Domain age: 4 days",
    time: "31 min ago",
    type: "url",
  },
  {
    id: "ALT-2024-0888",
    severity: "high" as const,
    title: "Document Metadata Forgery",
    detail: "contract_amendment_v3.pdf — Author field tampered post-signing. PDF object stream hash mismatch detected",
    time: "47 min ago",
    type: "document",
  },
  {
    id: "ALT-2024-0887",
    severity: "medium" as const,
    title: "Temporal Inconsistency in Video",
    detail: "interview_clip_final.mp4 — Frame 1,847–2,103 shows optical flow discontinuity. Possible face-swap region",
    time: "1 hr ago",
    type: "video",
  },
];

export const TREND_30D = [
  { date: "Apr 20", fake: 8, real: 31, pending: 3 },
  { date: "Apr 22", fake: 12, real: 28, pending: 5 },
  { date: "Apr 24", fake: 6, real: 35, pending: 2 },
  { date: "Apr 26", fake: 15, real: 22, pending: 4 },
  { date: "Apr 28", fake: 9, real: 40, pending: 6 },
  { date: "Apr 30", fake: 18, real: 33, pending: 3 },
  { date: "May 02", fake: 11, real: 38, pending: 4 },
  { date: "May 04", fake: 7, real: 44, pending: 2 },
  { date: "May 06", fake: 21, real: 29, pending: 7 },
  { date: "May 08", fake: 14, real: 36, pending: 5 },
  { date: "May 10", fake: 19, real: 41, pending: 3 },
  { date: "May 12", fake: 16, real: 48, pending: 6 },
  { date: "May 14", fake: 23, real: 37, pending: 4 },
  { date: "May 16", fake: 11, real: 52, pending: 2 },
  { date: "May 18", fake: 28, real: 44, pending: 8 },
  { date: "May 19", fake: 17, real: 39, pending: 5 },
];

export const CONTENT_TYPE_DIST = [
  { name: "Image", value: 38, count: 1247, color: "#00d4ff" },
  { name: "Video", value: 24, count: 789, color: "#9945ff" },
  { name: "Audio", value: 18, count: 591, color: "#00ff88" },
  { name: "Document", value: 12, count: 394, color: "#ffcc00" },
  { name: "URL", value: 8, count: 263, color: "#ff3366" },
];

export const RISK_DISTRIBUTION = [
  { range: "0–10", label: "Critical", count: 142, color: "#ff3366" },
  { range: "11–25", label: "High", count: 287, color: "#ff6b35" },
  { range: "26–40", label: "Elevated", count: 198, color: "#ffcc00" },
  { range: "41–60", label: "Moderate", count: 334, color: "#94a3b8" },
  { range: "61–75", label: "Low", count: 521, color: "#00d4ff" },
  { range: "76–100", label: "Authentic", count: 802, color: "#00ff88" },
];

export const HOURLY_ACTIVITY = [
  { hour: "00", scans: 12 },
  { hour: "01", scans: 8 },
  { hour: "02", scans: 5 },
  { hour: "03", scans: 4 },
  { hour: "04", scans: 7 },
  { hour: "05", scans: 11 },
  { hour: "06", scans: 19 },
  { hour: "07", scans: 34 },
  { hour: "08", scans: 67 },
  { hour: "09", scans: 89 },
  { hour: "10", scans: 102 },
  { hour: "11", scans: 94 },
  { hour: "12", scans: 78 },
  { hour: "13", scans: 88 },
  { hour: "14", scans: 112 },
  { hour: "15", scans: 97 },
  { hour: "16", scans: 84 },
  { hour: "17", scans: 71 },
  { hour: "18", scans: 58 },
  { hour: "19", scans: 43 },
  { hour: "20", scans: 37 },
  { hour: "21", scans: 29 },
  { hour: "22", scans: 22 },
  { hour: "23", scans: 16 },
];

export const STAT_SUMMARY = {
  totalAnalyses: 3284,
  totalAnalysesDelta: +12.4,
  highRisk: 429,
  highRiskDelta: +8.7,
  avgTrustScore: 67.3,
  avgTrustScoreDelta: -2.1,
  falsePositiveRate: 1.8,
  falsePositiveRateDelta: -0.3,
  modelsActive: 7,
  uptime: "99.97%",
  lastScanAgo: "2 min",
};
