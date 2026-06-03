"use client";

import { motion } from "framer-motion";
import { Cpu, Zap, Database, Server, CheckCircle2 } from "lucide-react";
import { STAT_SUMMARY } from "@/lib/demo-data";

const MODELS = [
  { name: "EfficientNet-B4", type: "Image", status: "active", latency: 847, accuracy: 97.3 },
  { name: "TimeSformer", type: "Video", status: "active", latency: 4821, accuracy: 94.1 },
  { name: "RawNet2", type: "Audio", status: "active", latency: 1203, accuracy: 96.8 },
  { name: "DocFormer", type: "Document", status: "active", latency: 692, accuracy: 93.5 },
  { name: "URLBert", type: "URL", status: "active", latency: 312, accuracy: 98.2 },
  { name: "FaceForensics++", type: "Image", status: "active", latency: 1104, accuracy: 95.7 },
  { name: "WaveFake", type: "Audio", status: "standby", latency: 0, accuracy: 91.4 },
];

export function SystemStatus() {
  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-cyber-accent" />
          <h2 className="text-sm font-semibold text-cyber-text tracking-wide">
            Engine Status
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-[11px] text-cyber-green font-medium">
            {STAT_SUMMARY.uptime} uptime
          </span>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: Cpu, label: "Models", value: STAT_SUMMARY.modelsActive, color: "text-cyber-accent" },
          { icon: Zap, label: "Last scan", value: STAT_SUMMARY.lastScanAgo, color: "text-cyber-green" },
          { icon: Database, label: "FP Rate", value: `${STAT_SUMMARY.falsePositiveRate}%`, color: "text-cyber-yellow" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="bg-cyber-surface/60 border border-cyber-border/50 rounded-lg p-3 text-center"
          >
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-cyber-muted mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Model list */}
      <div className="space-y-2">
        {MODELS.map((model, i) => (
          <motion.div
            key={model.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 + 0.2, duration: 0.25 }}
            className="flex items-center gap-3 py-2 px-3 rounded-lg bg-cyber-surface/40 border border-cyber-border/30 hover:border-cyber-border/60 transition-colors"
          >
            {/* Status dot */}
            <div className="relative shrink-0">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  model.status === "active" ? "bg-cyber-green" : "bg-cyber-muted"
                }`}
              />
              {model.status === "active" && (
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-cyber-green/40 animate-ping" />
              )}
            </div>

            {/* Name + type */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-cyber-text truncate">{model.name}</p>
              <p className="text-[10px] text-cyber-muted">{model.type}</p>
            </div>

            {/* Accuracy */}
            <div className="text-right shrink-0">
              <p className="text-[11px] font-mono font-semibold text-cyber-green">
                {model.accuracy}%
              </p>
              {model.status === "active" ? (
                <p className="text-[10px] text-cyber-muted">{model.latency}ms</p>
              ) : (
                <p className="text-[10px] text-cyber-muted">standby</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
