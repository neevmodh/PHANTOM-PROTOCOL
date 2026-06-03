"use client";

import { motion } from "framer-motion";
import {
  ImageIcon,
  Video,
  Mic,
  FileText,
  Link2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { THREAT_ACTIVITY } from "@/lib/demo-data";

const MEDIA_ICONS = {
  image: ImageIcon,
  video: Video,
  audio: Mic,
  document: FileText,
  url: Link2,
};

const MEDIA_COLORS = {
  image: "text-cyber-accent bg-cyber-accent/10 border-cyber-accent/20",
  video: "text-cyber-purple bg-cyber-purple/10 border-cyber-purple/20",
  audio: "text-cyber-green bg-cyber-green/10 border-cyber-green/20",
  document: "text-cyber-yellow bg-cyber-yellow/10 border-cyber-yellow/20",
  url: "text-cyber-red bg-cyber-red/10 border-cyber-red/20",
};

const VERDICT_CONFIG = {
  fake: {
    label: "Synthetic",
    badgeClass: "badge-danger",
    icon: ShieldAlert,
    color: "text-cyber-red",
    scoreBg: "bg-cyber-red/10",
  },
  real: {
    label: "Authentic",
    badgeClass: "badge-safe",
    icon: ShieldCheck,
    color: "text-cyber-green",
    scoreBg: "bg-cyber-green/10",
  },
  uncertain: {
    label: "Uncertain",
    badgeClass: "badge-warning",
    icon: AlertTriangle,
    color: "text-cyber-yellow",
    scoreBg: "bg-cyber-yellow/10",
  },
  pending: {
    label: "Pending",
    badgeClass: "badge-info",
    icon: Clock,
    color: "text-cyber-accent",
    scoreBg: "bg-cyber-accent/10",
  },
};

export function RecentScans() {
  return (
    <div className="glass-card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-cyber-border/50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyber-accent" />
          <h2 className="text-sm font-semibold text-cyber-text tracking-wide">
            Recent Scans
          </h2>
        </div>
        <button className="text-[11px] text-cyber-accent hover:text-cyber-accent/80 transition-colors flex items-center gap-1">
          View all
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-cyber-border/30">
        {["File / URL", "Type", "Model", "Score", "Verdict", "Time"].map((h, i) => (
          <p
            key={h}
            className={cn(
              "text-[10px] font-semibold text-cyber-muted uppercase tracking-widest",
              i === 0 && "col-span-4",
              i === 1 && "col-span-2",
              i === 2 && "col-span-2",
              i === 3 && "col-span-1 text-right",
              i === 4 && "col-span-2",
              i === 5 && "col-span-1 text-right"
            )}
          >
            {h}
          </p>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-cyber-border/20">
        {THREAT_ACTIVITY.slice(0, 8).map((item, i) => {
          const MediaIcon = MEDIA_ICONS[item.type as keyof typeof MEDIA_ICONS];
          const vc = VERDICT_CONFIG[item.verdict];
          const VerdictIcon = vc.icon;
          const mediaColor = MEDIA_COLORS[item.type as keyof typeof MEDIA_COLORS];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="grid grid-cols-12 gap-3 items-center px-5 py-3 hover:bg-cyber-surface/40 transition-colors group cursor-pointer"
            >
              {/* File */}
              <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0",
                    mediaColor
                  )}
                >
                  <MediaIcon className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-cyber-text truncate font-medium">{item.file}</p>
              </div>

              {/* Type */}
              <div className="col-span-2">
                <span className="text-[10px] text-cyber-muted-light capitalize">{item.type}</span>
              </div>

              {/* Model */}
              <div className="col-span-2">
                <span className="text-[10px] font-mono text-cyber-muted truncate block">
                  {item.model}
                </span>
              </div>

              {/* Score */}
              <div className="col-span-1 text-right">
                <span className={cn("text-sm font-bold font-mono", vc.color)}>
                  {item.score}
                </span>
              </div>

              {/* Verdict */}
              <div className="col-span-2">
                <span className={cn(vc.badgeClass, "text-[10px]")}>
                  <VerdictIcon className="w-2.5 h-2.5" />
                  {vc.label}
                </span>
              </div>

              {/* Time */}
              <div className="col-span-1 text-right">
                <span className="text-[10px] text-cyber-muted">{item.time}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-cyber-border/50 flex items-center justify-between">
        <p className="text-[11px] text-cyber-muted">
          Showing 8 of {THREAT_ACTIVITY.length} recent scans
        </p>
        <button className="btn-cyber text-xs px-4 py-1.5 flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5" />
          Load more
        </button>
      </div>
    </div>
  );
}
