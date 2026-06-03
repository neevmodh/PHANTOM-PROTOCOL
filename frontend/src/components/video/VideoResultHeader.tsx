"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck, ShieldAlert, Shield,
  Clock, Cpu, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoAnalysisResult } from "./VideoUploadPanel";

interface VideoResultHeaderProps {
  result: VideoAnalysisResult;
}

const VERDICT_CONFIG = {
  fake: {
    label: "DEEPFAKE DETECTED",
    sublabel: "Synthetic / AI-generated content",
    icon: ShieldAlert,
    color: "text-cyber-red",
    bg: "bg-cyber-red/10",
    border: "border-cyber-red/30",
    glow: "shadow-danger-glow",
    badge: "badge-danger",
    gradientFrom: "from-cyber-red/20",
  },
  uncertain: {
    label: "INCONCLUSIVE",
    sublabel: "Ambiguous forensic signals",
    icon: Shield,
    color: "text-cyber-yellow",
    bg: "bg-cyber-yellow/10",
    border: "border-cyber-yellow/30",
    glow: "",
    badge: "badge-warning",
    gradientFrom: "from-cyber-yellow/20",
  },
  real: {
    label: "AUTHENTIC",
    sublabel: "No manipulation detected",
    icon: ShieldCheck,
    color: "text-cyber-green",
    bg: "bg-cyber-green/10",
    border: "border-cyber-green/30",
    glow: "shadow-safe-glow",
    badge: "badge-safe",
    gradientFrom: "from-cyber-green/20",
  },
};

const RADIUS = 52;
const CIRC = 2 * Math.PI * RADIUS;

export function VideoResultHeader({ result }: VideoResultHeaderProps) {
  const vc = VERDICT_CONFIG[result.verdict];
  const VIcon = vc.icon;
  const progress = (result.trust_score / 100) * CIRC;
  const confPct = Math.round(result.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "glass-card p-6 border",
        vc.border,
        "relative overflow-hidden"
      )}
    >
      {/* Background glow */}
      <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-30", vc.gradientFrom)} />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Trust score gauge */}
        <div className="relative w-28 h-28 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgba(26,58,92,0.8)" strokeWidth="9" />
            <defs>
              <linearGradient id="videoGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={result.verdict === "fake" ? "#ff3366" : result.verdict === "uncertain" ? "#ffcc00" : "#00ff88"} />
                <stop offset="100%" stopColor={result.verdict === "fake" ? "#ff6b35" : result.verdict === "uncertain" ? "#00d4ff" : "#00d4ff"} />
              </linearGradient>
            </defs>
            <motion.circle
              cx="60" cy="60" r={RADIUS}
              fill="none" stroke="url(#videoGaugeGrad)"
              strokeWidth="9" strokeLinecap="round"
              strokeDasharray={CIRC}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: CIRC - progress }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.p
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className={cn("text-2xl font-bold font-mono", vc.color)}
            >
              {result.trust_score}
            </motion.p>
            <p className="text-[9px] text-cyber-muted uppercase tracking-widest">trust</p>
          </div>
        </div>

        {/* Verdict info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", vc.bg, "border", vc.border)}>
              <VIcon className={cn("w-4 h-4", vc.color)} />
              <span className={cn("text-sm font-bold tracking-wide", vc.color)}>{vc.label}</span>
            </div>
            <span className={cn(vc.badge, "text-[10px]")}>
              {confPct}% confidence
            </span>
          </div>
          <p className="text-sm text-cyber-muted-light mb-3">{vc.sublabel}</p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-cyber-muted">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-cyber-accent" />
              {result.model_used}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-cyber-accent" />
              {result.processing_time_ms}ms
            </span>
            <span className="font-mono text-cyber-muted/70 truncate max-w-[200px]">
              {result.filename}
            </span>
          </div>
        </div>

        {/* Download button */}
        <button className="btn-cyber text-xs px-4 py-2 flex items-center gap-2 shrink-0">
          <Download className="w-3.5 h-3.5" />
          Export Report
        </button>
      </div>
    </motion.div>
  );
}
