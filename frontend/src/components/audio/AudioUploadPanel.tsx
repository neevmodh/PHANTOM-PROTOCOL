"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, X, CheckCircle2, Loader2, AlertCircle, Mic, Music,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import type { AudioAnalysisResult } from "./types";

interface AudioUploadPanelProps {
  onResult: (data: AudioAnalysisResult) => void;
  onReset: () => void;
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STAGES = [
  { label: "Uploading audio file",       pct: 12 },
  { label: "Loading & resampling",        pct: 25 },
  { label: "Extracting MFCC features",    pct: 42 },
  { label: "Pitch & F0 analysis",         pct: 57 },
  { label: "Spectral anomaly detection",  pct: 70 },
  { label: "Noise & reverb analysis",     pct: 82 },
  { label: "Generating AI explanation",   pct: 93 },
  { label: "Finalising report",           pct: 100 },
];

export function AudioUploadPanel({ onResult, onReset }: AudioUploadPanelProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startProgress = () => {
    setStageIdx(0); setProgress(0);
    let idx = 0;
    timerRef.current = setInterval(() => {
      idx = Math.min(idx + 1, STAGES.length - 1);
      setStageIdx(idx);
      setProgress(STAGES[idx].pct);
      if (idx === STAGES.length - 1 && timerRef.current) clearInterval(timerRef.current);
    }, 1200);
  };

  const stopProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
  };

  const handleFile = useCallback(async (f: File) => {
    setFile(f); setState("uploading"); setError(null);
    startProgress();
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch(`${API_BASE}/api/audio/analyze`, { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${res.status}`);
      }
      const data: AudioAnalysisResult = await res.json();
      stopProgress(); setState("success"); onResult(data);
    } catch (err: unknown) {
      stopProgress(); setState("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }, [onResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (state === "idle") { const f = e.dataTransfer.files[0]; if (f) handleFile(f); }
  }, [state, handleFile]);

  const reset = () => {
    setFile(null); setState("idle"); setError(null); setProgress(0); setStageIdx(0);
    if (inputRef.current) inputRef.current.value = "";
    onReset();
  };

  const borderColor = {
    idle: "border-cyber-border hover:border-cyber-green",
    dragging: "border-cyber-green bg-cyber-green/5",
    uploading: "border-cyber-green/50",
    success: "border-cyber-green",
    error: "border-cyber-red",
  }[state];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mic className="w-4 h-4 text-cyber-green" />
        <h2 className="section-title">Upload Audio</h2>
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
          ref={inputRef} type="file"
          accept="audio/mpeg,audio/wav,audio/x-wav,audio/ogg,audio/flac,audio/mp4,audio/x-m4a,audio/aac"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cyber-green/10 border border-cyber-green/20 flex items-center justify-center mx-auto">
                <Music className="w-6 h-6 text-cyber-green" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyber-text">Drop audio here or click to browse</p>
                <p className="text-xs text-cyber-muted mt-1">WAV · MP3 · M4A · OGG · FLAC · Max 50 MB</p>
              </div>
              <div className="flex items-center justify-center gap-5 pt-1">
                {["MFCC Analysis", "Pitch Detection", "Voice Clone Score"].map((l) => (
                  <span key={l} className="text-[10px] text-cyber-muted flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-cyber-green/60 inline-block" />{l}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {state === "dragging" && (
            <motion.div key="dragging" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-2 py-2">
              <Upload className="w-10 h-10 text-cyber-green mx-auto animate-bounce" />
              <p className="text-sm font-medium text-cyber-green">Release to analyze</p>
            </motion.div>
          )}

          {state === "uploading" && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-2">
              {/* Circular progress */}
              <div className="relative w-14 h-14 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(0,255,136,0.12)" strokeWidth="4" />
                  <motion.circle cx="28" cy="28" r="24" fill="none" stroke="#00ff88" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - progress / 100) }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-mono font-bold text-cyber-green">{progress}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-cyber-green">{STAGES[stageIdx]?.label}</p>
                <p className="text-xs text-cyber-muted mt-0.5 truncate max-w-xs mx-auto">{file?.name}</p>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                {STAGES.map((_, i) => (
                  <div key={i} className={cn("rounded-full transition-all duration-300",
                    i < stageIdx ? "w-2 h-2 bg-cyber-green" :
                    i === stageIdx ? "w-3 h-3 bg-cyber-green animate-pulse" :
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
                <p className="text-xs text-cyber-muted mt-1 truncate max-w-xs mx-auto">
                  {file?.name} · {formatBytes(file?.size ?? 0)}
                </p>
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
