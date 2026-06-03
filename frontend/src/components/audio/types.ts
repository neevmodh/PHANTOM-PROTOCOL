import type { ForensicFinding, Verdict } from "@/lib/types";

export interface AudioAnalysisResult {
  id: string;
  filename: string;
  verdict: Verdict;
  confidence: number;
  trust_score: number;
  voice_clone_probability: number;
  flag_count: number;
  duration_seconds: number;
  sample_rate: number;
  forensic_findings: ForensicFinding[];
  spectrogram: number[][];   // [mel_bands, time_steps] — values 0-1
  waveform: number[];        // amplitude samples, values -1 to 1
  pitch_series: number[];    // F0 in Hz per frame
  flux_series: number[];     // spectral flux per frame
  rms_series: number[];      // RMS dB per frame
  explanation: string;
  model_used: string;
  processing_time_ms: number;
  timestamp: string;
}
