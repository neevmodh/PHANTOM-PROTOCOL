"use client";

import { motion } from "framer-motion";
import {
  AlertOctagon, AlertTriangle, ShieldAlert, Info,
  ChevronDown, ChevronUp, Mic,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ForensicFinding } from "@/lib/types";

interface AudioForensicFindingsProps {
  findings: ForensicFinding[];
  flagCount: number;
}

const SEV = {
  critical: { icon: AlertOctagon, color: "text-cyber-red",          bg: "bg-cyber-red/10",          border: "border-cyber-red/30",          badge: "badge-danger",  label: "CRITICAL" },
  high:     { icon: AlertTriangle, color: "text-cyber-yellow",       bg: "bg-cyber-yellow/10",       border: "border-cyber-yellow/30",       badge: "badge-warning", label: "HIGH" },
  medium:   { icon: ShieldAlert,   color: "text-cyber-accent",       bg: "bg-cyber-accent/10",       border: "border-cyber-accent/30",       badge: "badge-info",    label: "MEDIUM" },
  low:      { icon: Info,          color: "text-cyber-muted-light",  bg: "bg-cyber-muted/10",        border: "border-cyber-muted/20",        badge: "badge-info",    label: "LOW" },
};

export function AudioForensicFindings({ findings, flagCount }: AudioForensicFindingsProps) {
  const [expanded, setExpanded] = useState(true);

  if (!findings.length) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mic className="w-4 h-4 text-cyber-green" />
          <h2 className="section-title">Forensic Indicators</h2>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-green/5 border border-cyber-green/20">
          <Info className="w-4 h-4 text-cyber-green shrink-0" />
          <p className="text-sm text-cyber-green">No acoustic anomalies detected. Voice appears authentic.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-cyber-surface/30 transition-colors border-b border-cyber-border/50"
      >
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-cyber-red" />
          <h2 className="section-title">Forensic Indicators</h2>
          <span className="badge-danger text-[10px] ml-1">{flagCount} flags</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-cyber-muted" /> : <ChevronDown className="w-4 h-4 text-cyber-muted" />}
      </button>

      {expanded && (
        <div className="divide-y divide-cyber-border/30">
          {findings.map((f, i) => {
            const sc = SEV[f.severity];
            const SevIcon = sc.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className={cn(
                  "flex gap-4 px-6 py-4 hover:bg-cyber-surface/30 transition-colors",
                  f.severity === "critical" && "bg-cyber-red/[0.03]"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border", sc.bg, sc.border)}>
                  <SevIcon className={cn("w-4 h-4", sc.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-xs font-semibold text-cyber-text">{f.indicator}</p>
                    <span className={cn(sc.badge, "text-[10px]")}>{sc.label}</span>
                  </div>
                  <p className="text-[11px] text-cyber-muted-light leading-relaxed">{f.detail}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-cyber-border rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full",
                          f.severity === "critical" ? "bg-cyber-red" :
                          f.severity === "high" ? "bg-cyber-yellow" :
                          f.severity === "medium" ? "bg-cyber-accent" : "bg-cyber-muted"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(f.score * 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.06 + 0.2 }}
                      />
                    </div>
                    <span className={cn("text-[10px] font-mono shrink-0", sc.color)}>
                      {Math.round(f.score * 100)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
