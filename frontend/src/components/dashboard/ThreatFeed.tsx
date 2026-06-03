"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon,
  Video,
  Mic,
  FileText,
  Link2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ExternalLink,
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

const VERDICT_CONFIG = {
  fake: {
    label: "SYNTHETIC",
    badgeClass: "badge-danger",
    icon: ShieldAlert,
    color: "text-cyber-red",
    dot: "bg-cyber-red",
  },
  real: {
    label: "AUTHENTIC",
    badgeClass: "badge-safe",
    icon: ShieldCheck,
    color: "text-cyber-green",
    dot: "bg-cyber-green",
  },
  uncertain: {
    label: "UNCERTAIN",
    badgeClass: "badge-warning",
    icon: AlertTriangle,
    color: "text-cyber-yellow",
    dot: "bg-cyber-yellow",
  },
  pending: {
    label: "PENDING",
    badgeClass: "badge-info",
    icon: Clock,
    color: "text-cyber-accent",
    dot: "bg-cyber-accent",
  },
};

export function ThreatFeed() {
  return (
    <div className="glass-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-cyber-border/50">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-cyber-red animate-pulse" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyber-red/40 animate-ping" />
          </div>
          <h2 className="text-sm font-semibold text-cyber-text tracking-wide">
            Threat Activity Feed
          </h2>
        </div>
        <span className="badge-danger text-[10px]">
          <ShieldAlert className="w-2.5 h-2.5" />
          LIVE
        </span>
      </div>

      {/* Feed items */}
      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-cyber-border/30">
        <AnimatePresence>
          {THREAT_ACTIVITY.map((item, i) => {
            const MediaIcon = MEDIA_ICONS[item.type as keyof typeof MEDIA_ICONS];
            const vc = VERDICT_CONFIG[item.verdict];
            const VerdictIcon = vc.icon;

            return (
              <motion.div
                key={`${item.time}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-cyber-surface/40 transition-colors group"
              >
                {/* Verdict dot */}
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                  <div className={cn("w-1.5 h-1.5 rounded-full", vc.dot)} />
                  {i < THREAT_ACTIVITY.length - 1 && (
                    <div className="w-px flex-1 min-h-[20px] bg-cyber-border/40" />
                  )}
                </div>

                {/* Media icon */}
                <div className="w-7 h-7 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-center shrink-0 mt-0.5">
                  <MediaIcon className="w-3.5 h-3.5 text-cyber-muted-light" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium text-cyber-text truncate max-w-[160px]">
                      {item.file}
                    </p>
                    <span className={cn(vc.badgeClass, "text-[10px] shrink-0")}>
                      <VerdictIcon className="w-2.5 h-2.5" />
                      {vc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-cyber-muted">{item.model}</span>
                    <span className="text-[10px] text-cyber-muted/60">{item.ms}ms</span>
                  </div>
                </div>

                {/* Score + time */}
                <div className="text-right shrink-0">
                  <p className={cn("text-sm font-bold font-mono", vc.color)}>
                    {item.score}
                  </p>
                  <p className="text-[10px] text-cyber-muted mt-0.5">{item.time}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-cyber-border/50">
        <button className="w-full text-[11px] text-cyber-accent hover:text-cyber-accent/80 transition-colors flex items-center justify-center gap-1.5">
          <ExternalLink className="w-3 h-3" />
          View full activity log
        </button>
      </div>
    </div>
  );
}
