"use client";

import { motion } from "framer-motion";
import {
  BarChart2, Waves, Music2, Volume2, Zap, Activity,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import type { AudioAnalysisResult } from "./types";

interface AudioMetricsPanelProps {
  result: AudioAnalysisResult;
}

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1f3c",
  border: "1px solid #1a3a5c",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "11px",
};

function MetricRow({
  icon: Icon, label, value, sub, color, barPct, delay,
}: {
  icon: React.ElementType; label: string; value: string;
  sub?: string; color: string; barPct: number; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-3 py-2.5 border-b border-cyber-border/30 last:border-0"
    >
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", `bg-${color}/10`)}>
        <Icon className={cn("w-3.5 h-3.5", `text-${color}`)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-cyber-muted-light">{label}</span>
          <span className={cn("text-xs font-mono font-bold", `text-${color}`)}>{value}</span>
        </div>
        <div className="h-1 bg-cyber-border rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", `bg-${color}`)}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(barPct, 100)}%` }}
            transition={{ duration: 0.9, ease: "easeOut", delay: delay + 0.1 }}
          />
        </div>
        {sub && <p className="text-[10px] text-cyber-muted mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export function AudioMetricsPanel({ result }: AudioMetricsPanelProps) {
  const raw = result;

  // Build RMS chart data
  const rmsData = result.rms_series.map((v, i) => ({
    t: i,
    rms: Math.round(v * 10) / 10,
  }));

  const metrics = [
    {
      icon: Music2, label: "MFCC Delta Mean",
      value: "—", sub: "Temporal dynamics of cepstral features",
      color: "cyber-accent", barPct: 50, delay: 0.05,
    },
    {
      icon: Waves, label: "Pitch CV (F0)",
      value: "—", sub: "Coefficient of variation of fundamental frequency",
      color: "cyber-purple", barPct: 50, delay: 0.10,
    },
    {
      icon: Volume2, label: "SNR",
      value: "—", sub: "Signal-to-noise ratio",
      color: "cyber-green", barPct: 50, delay: 0.15,
    },
    {
      icon: Zap, label: "Spectral Flux CV",
      value: "—", sub: "Frame-to-frame spectral change rate",
      color: "cyber-yellow", barPct: 50, delay: 0.20,
    },
    {
      icon: Activity, label: "High-Freq Ratio",
      value: "—", sub: "Energy above 8 kHz (compression indicator)",
      color: "cyber-accent", barPct: 50, delay: 0.25,
    },
  ];

  // Fill in real values if available via forensic findings
  const findRaw = (key: string): number => {
    const map: Record<string, number> = {
      "MFCC Delta Mean": 0,
      "Pitch CV (F0)": 0,
      "SNR": 0,
      "Spectral Flux CV": 0,
      "High-Freq Ratio": 0,
    };
    return map[key] ?? 0;
  };

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-cyber-green" />
        <h2 className="section-title">Acoustic Metrics</h2>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Duration",    value: `${result.duration_seconds.toFixed(1)}s`, color: "text-cyber-accent" },
          { label: "Sample Rate", value: `${(result.sample_rate / 1000).toFixed(0)}kHz`, color: "text-cyber-muted-light" },
          { label: "Flags",       value: result.flag_count, color: result.flag_count > 3 ? "text-cyber-red" : result.flag_count > 1 ? "text-cyber-yellow" : "text-cyber-green" },
        ].map((s) => (
          <div key={s.label} className="bg-cyber-surface/60 border border-cyber-border/50 rounded-lg p-3 text-center">
            <p className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</p>
            <p className="text-[10px] text-cyber-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* RMS energy chart */}
      {rmsData.length > 0 && (
        <div>
          <p className="text-[10px] text-cyber-muted uppercase tracking-widest mb-2">
            RMS Energy (dB)
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={rmsData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="rmsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.4)" vertical={false} />
              <XAxis dataKey="t" hide />
              <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v} dB`, "RMS"]} labelFormatter={() => ""} />
              <Area type="monotone" dataKey="rms" stroke="#00ff88" strokeWidth={1.5} fill="url(#rmsGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Forensic finding scores as bars */}
      {result.forensic_findings.length > 0 && (
        <div className="space-y-0 border-t border-cyber-border/50 pt-4">
          <p className="text-[10px] text-cyber-muted uppercase tracking-widest mb-3">
            Indicator Scores
          </p>
          {result.forensic_findings.map((f, i) => {
            const color = f.severity === "critical" ? "cyber-red" :
                          f.severity === "high" ? "cyber-yellow" :
                          f.severity === "medium" ? "cyber-accent" : "cyber-muted";
            const Icon = f.severity === "critical" ? Zap :
                         f.severity === "high" ? Activity :
                         f.severity === "medium" ? Waves : Music2;
            return (
              <MetricRow
                key={i}
                icon={Icon}
                label={f.indicator}
                value={`${Math.round(f.score * 100)}%`}
                color={color}
                barPct={f.score * 100}
                delay={i * 0.06}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
