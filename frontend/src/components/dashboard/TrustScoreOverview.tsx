"use client";

import { motion } from "framer-motion";
import { Shield, ShieldCheck, ShieldAlert, TrendingDown } from "lucide-react";
import { STAT_SUMMARY, CONTENT_TYPE_DIST } from "@/lib/demo-data";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function MiniGauge({
  score,
  color,
  size = 80,
}: {
  score: number;
  color: string;
  size?: number;
}) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const progress = (score / 100) * c;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(26,58,92,0.8)" strokeWidth="7" />
      <motion.circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - progress }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
}

export function TrustScoreOverview() {
  const score = STAT_SUMMARY.avgTrustScore;
  const progress = (score / 100) * CIRCUMFERENCE;

  const breakdown = [
    { label: "Image", score: 71, color: "#00d4ff" },
    { label: "Video", score: 58, color: "#9945ff" },
    { label: "Audio", score: 63, color: "#00ff88" },
    { label: "Document", score: 74, color: "#ffcc00" },
    { label: "URL", score: 52, color: "#ff3366" },
  ];

  return (
    <div className="glass-card p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyber-accent" />
          <h2 className="text-sm font-semibold text-cyber-text tracking-wide">
            Trust Score Overview
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-cyber-red bg-cyber-red/10 border border-cyber-red/20 px-2 py-1 rounded-full">
          <TrendingDown className="w-3 h-3" />
          {STAT_SUMMARY.avgTrustScoreDelta}% vs last week
        </div>
      </div>

      {/* Main gauge */}
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            {/* Track */}
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="rgba(26,58,92,0.8)"
              strokeWidth="10"
            />
            {/* Gradient progress */}
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00d4ff" />
                <stop offset="100%" stopColor="#9945ff" />
              </linearGradient>
            </defs>
            <motion.circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: CIRCUMFERENCE - progress }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-2xl font-bold font-mono text-cyber-accent"
            >
              {score}
            </motion.p>
            <p className="text-[10px] text-cyber-muted uppercase tracking-widest">avg</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyber-green shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyber-muted-light">Authentic ≥70</span>
                <span className="text-cyber-green font-mono font-semibold">1,802</span>
              </div>
              <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-cyber-green rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "54.9%" }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyber-yellow shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyber-muted-light">Uncertain 40–69</span>
                <span className="text-cyber-yellow font-mono font-semibold">1,053</span>
              </div>
              <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-cyber-yellow rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "32.1%" }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyber-red shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cyber-muted-light">Synthetic &lt;40</span>
                <span className="text-cyber-red font-mono font-semibold">429</span>
              </div>
              <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-cyber-red rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "13.1%" }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-type mini gauges */}
      <div className="border-t border-cyber-border/50 pt-4">
        <p className="text-[10px] text-cyber-muted uppercase tracking-widest mb-3">
          Avg score by media type
        </p>
        <div className="grid grid-cols-5 gap-2">
          {breakdown.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <div className="relative">
                <MiniGauge score={item.score} color={item.color} size={52} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-[11px] font-bold font-mono"
                    style={{ color: item.color }}
                  >
                    {item.score}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-cyber-muted">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
