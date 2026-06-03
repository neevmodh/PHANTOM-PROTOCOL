"use client";

import { motion } from "framer-motion";
import {
  Eye, Mic2, Move, Zap, Activity, Cpu, Clock, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoAnalysisResult } from "./VideoUploadPanel";

interface TemporalScorePanelProps {
  result: VideoAnalysisResult;
}

function ScoreBar({
  label,
  icon: Icon,
  value,
  color,
  delay,
}: {
  label: string;
  icon: React.ElementType;
  value: number;
  color: string;
  delay: number;
}) {
  const pct = Math.round(value * 100);
  const isHigh = pct >= 65;
  const barColor = isHigh ? "bg-cyber-red" : pct >= 35 ? "bg-cyber-yellow" : "bg-cyber-green";
  const textColor = isHigh ? "text-cyber-red" : pct >= 35 ? "text-cyber-yellow" : "text-cyber-green";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-3.5 h-3.5", color)} />
          <span className="text-xs text-cyber-muted-light">{label}</span>
        </div>
        <span className={cn("text-xs font-mono font-bold", textColor)}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay }}
        />
      </div>
    </div>
  );
}

export function TemporalScorePanel({ result }: TemporalScorePanelProps) {
  const conf = result.confidence;
  const suspPct = Math.round((result.suspicious_frames / Math.max(result.frames_analyzed, 1)) * 100);

  // Derive per-indicator scores from findings
  const findingScore = (indicator: string) => {
    const f = result.forensic_findings.find((x) =>
      x.indicator.toLowerCase().includes(indicator.toLowerCase())
    );
    return f ? f.score : 0;
  };

  const indicators = [
    { label: "GAN Frequency Artifacts", icon: Zap, value: findingScore("GAN"), color: "text-cyber-red" },
    { label: "Temporal Inconsistency", icon: Activity, value: findingScore("Temporal"), color: "text-cyber-purple" },
    { label: "Lip-Sync Mismatch", icon: Mic2, value: findingScore("Lip"), color: "text-cyber-yellow" },
    { label: "Eye Blink Consistency", icon: Eye, value: findingScore("Eye"), color: "text-cyber-accent" },
    { label: "Head Movement Anomaly", icon: Move, value: findingScore("Head"), color: "text-cyber-green" },
    { label: "Lighting Inconsistency", icon: Cpu, value: findingScore("Lighting"), color: "text-cyber-muted-light" },
  ];

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-cyber-purple" />
        <h2 className="section-title">Temporal Forensics</h2>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Frames", value: result.frames_analyzed, icon: BarChart2, color: "text-cyber-accent" },
          { label: "Suspicious", value: `${suspPct}%`, icon: Activity, color: suspPct > 30 ? "text-cyber-red" : "text-cyber-yellow" },
          { label: "Duration", value: `${result.duration_seconds.toFixed(1)}s`, icon: Clock, color: "text-cyber-muted-light" },
        ].map((s) => (
          <div key={s.label} className="bg-cyber-surface/60 border border-cyber-border/50 rounded-lg p-3 text-center">
            <s.icon className={cn("w-4 h-4 mx-auto mb-1", s.color)} />
            <p className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</p>
            <p className="text-[10px] text-cyber-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Indicator bars */}
      <div className="space-y-3">
        <p className="text-[10px] text-cyber-muted uppercase tracking-widest">
          Anomaly Scores
        </p>
        {indicators.map((ind, i) => (
          <ScoreBar key={ind.label} {...ind} delay={i * 0.07} />
        ))}
      </div>

      {/* FPS + model */}
      <div className="pt-2 border-t border-cyber-border/50 flex items-center justify-between text-[11px] text-cyber-muted">
        <span>{result.fps} fps · {result.total_frames} total frames</span>
        <span className="font-mono text-cyber-accent/70">{result.model_used}</span>
      </div>
    </div>
  );
}
