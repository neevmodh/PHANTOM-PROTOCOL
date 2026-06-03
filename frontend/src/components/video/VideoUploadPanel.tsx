"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, X, CheckCircle2, Loader2, AlertCircle,
  Video, Film, Clock, Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoUploadPanelProps {
  onResult: (data: VideoAnalysisResult) => void;
  onReset: () => void;
}

export interface VideoAnalysisResult {
  id: string;
  filename: string;
  verdict: "real" | "fake" | "uncertain";
  confidence: number;
  trust_score: number;
  flag_count: number;
  frames_analyzed: number;
  total_frames: number;
  suspicious_frames: number;
  duration_seconds: number;
  fps: number;
  forensic_findings: ForensicFinding[];
  saved_frames: SavedFrame[];
  frame_timeline: FrameTimelinePoint[];
  explanation: string;
  model_used: string;
  processing_time_ms: number;
  timestamp: string;
}

export interface ForensicFinding {
  indicator: string;
  severity: "critical" | "high" | "medium" | "low";
  detail: string;
  score: number;
}

export interface SavedFrame {
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

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STAGES = [
  { label: "Uploading video", pct: 15 },
  { label: "Extracting frames", pct: 35 },
  { label: "Running ELA analysis", pct: 55 },
  { label: "Temporal consistency check", pct: 72 },
  { label: "Lip-sync & blink analysis", pct: 85 },
  { label: "Generating AI explanation", pct: 95 },
  { label: "Finalising report", pct: 100 },
];

export function VideoUploadPanel({ onResult, onReset }: VideoUploadPanelProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startProgressAnimation = () => {
    setStageIdx(0);
    setProgress(0);
    let idx = 0;
    stageTimerRef.current = setInterval(() => {
      idx = Math.min(idx + 1, STAGES.length - 1);
      setStageIdx(idx);
      setProgress(STAGES[idx].pct);
      if (idx === STAGES.length - 1 && stageTimerRef.current) {
        clearInterval(stageTimerRef.current);
      }
    }, 1400);
  };

  const stopProgress = () => {
    if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    setProgress(100);
  };

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setState("uploading");
    setError(null);
    startProgressAnimation();

    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch(`${API_BASE}/api/video/analyze-video`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${res.status}`);
      }
      const data: VideoAnalysisResult = await res.json();
      stopProgress();
      setState("success");
      onResult(data);
    } catch (err: unknown) {
      stopProgress();
      setState("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }, [onResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState("idle");
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const reset = () => {
    setFile(null);
    setState("idle");
    setError(null);
    setProgress(0);
    setStageIdx(0);
    if (inputRef.current) inputRef.current.value = "";
    onReset();
  };

  const borderColor = {
    idle: "border-cyber-border hover:border-cyber-accent",
    dragging: "border-cyber-accent bg-cyber-accent/5",
    uploading: "border-cyber-purple/60",
    success: "border-cyber-green",
    error: "border-cyber-red",
  }[state];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Video className="w-4 h-4 text-cyber-accent" />
        <h2 className="section-title">Upload Video</h2>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); if (state === "idle") setState("dragging"); }}
        onDragLeave={() => { if (state === "dragging") setState("idle"); }}
        onDrop={onDrop}
        onClick={() => state === "idle" && inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200",
          borderColor,
          state === "idle" && "cursor-pointer hover:bg-cyber-surface/50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center mx-auto">
                <Film className="w-6 h-6 text-cyber-purple" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyber-text">Drop video here or click to browse</p>
                <p className="text-xs text-cyber-muted mt-1">MP4 · MOV · WEBM · AVI · Max 50 MB</p>
              </div>
              <div className="flex items-center justify-center gap-4 pt-1">
                {[["Frame Analysis", Film], ["Temporal Check", Clock], ["Trust Score", Gauge]].map(([label, Icon]) => (
                  <div key={label as string} className="flex items-center gap-1.5 text-[10px] text-cyber-muted">
                    {/* @ts-expect-error dynamic icon */}
                    <Icon className="w-3 h-3 text-cyber-purple/70" />
                    {label}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {state === "dragging" && (
            <motion.div key="dragging" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-2 py-2">
              <Upload className="w-10 h-10 text-cyber-accent mx-auto animate-bounce" />
              <p className="text-sm font-medium text-cyber-accent">Release to analyze</p>
            </motion.div>
          )}

          {state === "uploading" && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-2">
              {/* Spinner */}
              <div className="relative w-14 h-14 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(153,69,255,0.15)" strokeWidth="4" />
                  <motion.circle
                    cx="28" cy="28" r="24" fill="none"
                    stroke="#9945ff" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - progress / 100) }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-mono font-bold text-cyber-purple">{progress}%</span>
                </div>
              </div>

              {/* Stage label */}
              <div>
                <p className="text-sm font-medium text-cyber-purple">{STAGES[stageIdx]?.label}</p>
                <p className="text-xs text-cyber-muted mt-0.5 truncate max-w-xs mx-auto">{file?.name}</p>
              </div>

              {/* Stage dots */}
              <div className="flex items-center justify-center gap-1.5">
                {STAGES.map((_, i) => (
                  <div key={i} className={cn(
                    "rounded-full transition-all duration-300",
                    i < stageIdx ? "w-2 h-2 bg-cyber-purple" :
                    i === stageIdx ? "w-3 h-3 bg-cyber-purple animate-pulse" :
                    "w-1.5 h-1.5 bg-cyber-border"
                  )} />
                ))}
              </div>
            </motion.div>
          )}

          {state === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-3 py-2">
              <CheckCircle2 className="w-12 h-12 text-cyber-green mx-auto" />
              <div>
                <p className="text-sm font-medium text-cyber-green">Analysis complete</p>
                <p className="text-xs text-cyber-muted mt-1 truncate max-w-xs mx-auto">{file?.name}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); reset(); }} className="btn-cyber text-xs px-4 py-1.5 mx-auto flex items-center gap-1.5">
                <X className="w-3 h-3" /> Analyze another
              </button>
            </motion.div>
          )}

          {state === "error" && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-3 py-2">
              <AlertCircle className="w-10 h-10 text-cyber-red mx-auto" />
              <div>
                <p className="text-sm font-medium text-cyber-red">Analysis failed</p>
                <p className="text-xs text-cyber-muted mt-1 max-w-xs mx-auto">{error}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); reset(); }} className="btn-cyber-danger text-xs px-4 py-1.5 mx-auto flex items-center gap-1.5">
                <X className="w-3 h-3" /> Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
