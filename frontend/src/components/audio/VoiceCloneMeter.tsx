"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, AlertTriangle, ShieldCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceCloneMeterProps {
  probability: number;   // 0–1
  confidence: number;    // 0–1
  trustScore: number;    // 0–100
  verdict: "real" | "fake" | "uncertain";
}

const VERDICT_CONFIG = {
  fake: {
    label: "VOICE CLONE DETECTED",
    sub: "AI-synthesised or cloned speech",
    icon: MicOff,
    color: "text-cyber-red",
    bg: "bg-cyber-red/10",
    border: "border-cyber-red/30",
    barColor: "bg-cyber-red",
    glow: "shadow-danger-glow",
  },
  uncertain: {
    label: "INCONCLUSIVE",
    sub: "Ambiguous acoustic signals",
    icon: AlertTriangle,
    color: "text-cyber-yellow",
    bg: "bg-cyber-yellow/10",
    border: "border-cyber-yellow/30",
    barColor: "bg-cyber-yellow",
    glow: "",
  },
  real: {
    label: "AUTHENTIC VOICE",
    sub: "Natural human speech detected",
    icon: ShieldCheck,
    color: "text-cyber-green",
    bg: "bg-cyber-green/10",
    border: "border-cyber-green/30",
    barColor: "bg-cyber-green",
    glow: "shadow-safe-glow",
  },
};

const RADIUS = 52;
const CIRC = 2 * Math.PI * RADIUS;

export function VoiceCloneMeter({ probability, confidence, trustScore, verdict }: VoiceCloneMeterProps) {
  const vc = VERDICT_CONFIG[verdict];
  const VIcon = vc.icon;
  const progress = (trustScore / 100) * CIRC;
  const probPct = Math.round(probability * 100);
  const confPct = Math.round(confidence * 100);

  // Meter segments: 0-30 safe, 30-60 warning, 60-100 danger
  const segments = [
    { label: "Authentic", range: "0–30%", color: "#00ff88", active: probPct < 30 },
    { label: "Suspicious", range: "30–60%", color: "#ffcc00", active: probPct >= 30 && probPct < 60 },
    { label: "Synthetic", range: "60–100%", color: "#ff3366", active: probPct >= 60 },
  ];

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-cyber-green" />
        <h2 className="section-title">Voice Analysis</h2>
      </div>

      {/* Trust gauge + verdict */}
      <div className="flex items-center gap-5">
        {/* SVG gauge */}
        <div className="relative w-28 h-28 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgba(26,58,92,0.8)" strokeWidth="9" />
            <defs>
              <linearGradient id="audioGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={verdict === "fake" ? "#ff3366" : verdict === "uncertain" ? "#ffcc00" : "#00ff88"} />
                <stop offset="100%" stopColor={verdict === "fake" ? "#ff6b35" : verdict === "uncertain" ? "#00d4ff" : "#00d4ff"} />
              </linearGradient>
            </defs>
            <motion.circle
              cx="60" cy="60" r={RADIUS}
              fill="none" stroke="url(#audioGaugeGrad)"
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
              transition={{ delay: 0.5 }}
              className={cn("text-2xl font-bold font-mono", vc.color)}
            >
              {trustScore}
            </motion.p>
            <p className="text-[9px] text-cyber-muted uppercase tracking-widest">trust</p>
          </div>
        </div>

        {/* Verdict */}
        <div className="flex-1 space-y-2">
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", vc.bg, vc.border)}>
            <VIcon className={cn("w-4 h-4 shrink-0", vc.color)} />
            <span className={cn("text-xs font-bold tracking-wide", vc.color)}>{vc.label}</span>
          </div>
          <p className="text-xs text-cyber-muted-light">{vc.sub}</p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-cyber-muted">Confidence:</span>
            <span className={cn("font-mono font-semibold", vc.color)}>{confPct}%</span>
          </div>
        </div>
      </div>

      {/* Voice clone probability meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-cyber-muted-light">Voice Clone Probability</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className={cn("font-mono font-bold text-sm", vc.color)}
          >
            {probPct}%
          </motion.span>
        </div>

        {/* Gradient bar */}
        <div className="relative h-4 rounded-full overflow-hidden bg-cyber-border/50">
          {/* Background gradient */}
          <div className="absolute inset-0 rounded-full" style={{
            background: "linear-gradient(to right, rgba(0,255,136,0.3) 0%, rgba(255,204,0,0.3) 40%, rgba(255,51,102,0.3) 100%)"
          }} />
          {/* Fill */}
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              background: `linear-gradient(to right, #00ff88, ${probPct > 60 ? "#ff3366" : probPct > 30 ? "#ffcc00" : "#00ff88"})`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${probPct}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
          {/* Threshold markers */}
          {[30, 60].map((pct) => (
            <div key={pct} className="absolute top-0 bottom-0 w-px bg-cyber-bg/60" style={{ left: `${pct}%` }} />
          ))}
        </div>

        {/* Segment labels */}
        <div className="flex justify-between text-[10px]">
          {segments.map((s) => (
            <div key={s.label} className={cn("flex items-center gap-1", s.active ? "" : "opacity-40")}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span style={{ color: s.active ? s.color : "#64748b" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-scores */}
      <div className="space-y-2 pt-1 border-t border-cyber-border/50">
        {[
          { label: "Authenticity", value: trustScore, color: vc.color },
          { label: "Confidence",   value: confPct,    color: vc.color },
          { label: "Naturalness",  value: Math.max(0, 100 - probPct), color: probPct < 30 ? "text-cyber-green" : probPct < 60 ? "text-cyber-yellow" : "text-cyber-red" },
        ].map((item, i) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-cyber-muted">{item.label}</span>
              <span className={cn("font-mono font-semibold", item.color)}>{item.value}%</span>
            </div>
            <div className="h-1 bg-cyber-border rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", vc.barColor)}
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 + i * 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
