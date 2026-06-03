// ── Shared types ──────────────────────────────────────────────

export type MediaType = "image" | "video" | "audio" | "document" | "url";
export type Verdict = "real" | "fake" | "uncertain" | "pending";
export type Severity = "critical" | "high" | "medium" | "low";

export interface ForensicFinding {
  indicator: string;
  severity: Severity;
  detail: string;
  score: number;
}

export interface ForensicExplanationFinding {
  title: string;
  detail: string;
  severity: Severity | string;
  confidence: number;
}

export interface ForensicExplanationReport {
  human_readable_explanation: string;
  threat_reasoning: string;
  key_suspicious_findings: ForensicExplanationFinding[];
  severity_assessment: {
    level: Severity | "medium";
    badge: string;
    summary: string;
  };
  trust_analysis_summary: string;
  generated_by?: "groq" | "fallback";
}

export interface VideoFrame {
  frame_index: number;
  url: string;
  ela_score: number;
  freq_score: number;
  suspicious: boolean;
}

export interface FrameTimelinePoint {
  index: number;
  ela: number;
  freq: number;
  suspicious: boolean;
}

export interface BaseDetectionRecord {
  id: string;
  timestamp: string;
  trust_score: number;
  verdict: Verdict;
  confidence: number;
  model_used: string;
  processing_time_ms: number;
}

export interface ImageRecord extends BaseDetectionRecord {
  filename: string;
  file_path: string;
  manipulation_regions: string; // JSON string
}

export interface VideoRecord extends BaseDetectionRecord {
  filename: string;
  file_path: string;
  frames_analyzed: number;
  total_frames: number;
  suspicious_frames: number;
  duration_seconds: number;
  fps: number;
  explanation_report?: ForensicExplanationReport;
  flag_count: number;
  forensic_findings: ForensicFinding[];
  saved_frames: VideoFrame[];
  frame_timeline: FrameTimelinePoint[];
  explanation: string;
}

export interface AudioRecord extends BaseDetectionRecord {
  filename: string;
  file_path: string;
  duration_seconds: number;
  sample_rate: number;
  voice_clone_probability: number;
  flag_count: number;
  forensic_findings: ForensicFinding[];
  spectrogram: number[][];
  waveform: number[];
  pitch_series: number[];
  flux_series: number[];
  rms_series: number[];
  explanation: string;
}

export interface DocumentRecord extends BaseDetectionRecord {
  filename: string;
  file_path: string;
  ai_generated_probability: number;
  tamper_detected: boolean;
  explanation_report?: ForensicExplanationReport;
  preview_text?: string;
  document_type?: "pdf" | "docx" | "txt" | "unknown";
  ocr_consistency?: number;
  metadata_mismatch?: number | { score: number; detail: string };
  formatting_anomalies?: number | { score: number; detail: string };
  semantic_consistency?: number;
  suspicious_structure?: number | { score: number; detail: string };
  forensic_indicators?: ForensicFinding[];
  explanation?: string;
}

export interface URLRecord extends BaseDetectionRecord {
  url: string;
  risk_level: "low" | "medium" | "high" | "critical";
  trust_score: number;
  confidence_score: number;
  verdict: Verdict;
  ssl_valid: boolean;
  https_valid: boolean;
  redirect_count: number;
  domain_reputation: {
    label: string;
    score: number;
    signal: string;
  };
  threat_indicators: string[];
  forensic_reasons: Array<{
    indicator: string;
    severity: Severity | string;
    detail: string;
    score: number;
  }>;
  explanation_report?: ForensicExplanationReport;
  explanation: string;
  processing_time_ms: number;
}

export interface AnalyticsSummary {
  image: TypeSummary;
  video: TypeSummary;
  audio: TypeSummary;
  document: TypeSummary;
  url: TypeSummary;
}

export interface TypeSummary {
  total: number;
  flagged: number;
  clean: number;
  pending: number;
}

export interface TrendPoint {
  date: string;
  fake: number;
  real: number;
  pending: number;
}

export interface BreakdownItem {
  type: MediaType;
  count: number;
}

export interface Report {
  report_id: string;
  filename: string;
}
