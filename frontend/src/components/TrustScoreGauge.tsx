"use client";

import { motion } from "framer-motion";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface TrustScoreGaugeProps {
  score: number | null; // 0–100
}

function getScoreConfig(score: number | null) {
  if (score === null) {
    return {
      label: "Awaiting Analysis",
      color: "text-cyber-muted",
      ringColor: "stroke-cyber-border",
      bgColor: "bg-cyber-muted/10",
      icon: Shield,
      verdict: "—",
      badgeClass: "badge-info",
    };
  }
  if (score >= 70) {
    return {
      label: "Authentic",
      color: "text-cyber-green",
      ringColor: "stroke-cyber-green",
      bgColor: "bg-cyber-green/10",
      icon: ShieldCheck,
      verdict: "REAL",
      badgeClass: "badge-safe",
    };
  }
  if (score >= 40) {
    return {
      label: "Suspicious",
      color: "text-cyber-yellow",
      ringColor: "stroke-cyber-yellow",
      bgColor: "bg-cyber-yellow/10",
      icon: Shield,
      verdict: "UNCERTAIN",
      badgeClass: "badge-warning",
    };
  }
  return {
    label: "Synthetic / Fake",
    color: "text-cyber-red",
    ringColor: "stroke-cyber-red",
    bgColor: "bg-cyber-red/10",
    icon: ShieldAlert,
    verdict: "FAKE",
    badgeClass: "badge-danger",
  };
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TrustScoreGauge({ score }: TrustScoreGaugeProps) {
  const config = getScoreConfig(score);
  const progress = score !== null ? (score / 100) * CIRCUMFERENCE : 0;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="section-title self-start">Trust Score</h2>

      {/* SVG gauge */}
      <div className="relative w-40 h-40">
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
          {/* Progress */}
          <motion.circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            className={config.ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: CIRCUMFERENCE - progress }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.p
            key={score}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className={`text-3xl font-bold font-mono ${config.color}`}
          >
            {score !== null ? score : "—"}
          </motion.p>
          {score !== null && (
            <p className="text-[10px] text-cyber-muted uppercase tracking-widest">
              / 100
            </p>
          )}
        </div>
      </div>

      {/* Verdict */}
      <div className="text-center space-y-2">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${config.bgColor}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
        </div>
        <div>
          <span className={config.badgeClass}>{config.verdict}</span>
        </div>
      </div>

      {/* Score breakdown bars */}
      <div className="w-full space-y-2">
        {[
          { label: "Authenticity", value: score },
          { label: "Integrity", value: score !== null ? Math.min(100, score + 5) : null },
          { label: "Confidence", value: score !== null ? Math.max(0, score - 8) : null },
        ].map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-cyber-muted">{item.label}</span>
              <span className={config.color}>
                {item.value !== null ? `${item.value}%` : "—"}
              </span>
            </div>
            <div className="h-1 bg-cyber-border rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  item.value !== null && item.value >= 70
                    ? "bg-cyber-green"
                    : item.value !== null && item.value >= 40
                    ? "bg-cyber-yellow"
                    : "bg-cyber-red"
                }`}
                initial={{ width: 0 }}
                animate={{ width: item.value !== null ? `${item.value}%` : "0%" }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
