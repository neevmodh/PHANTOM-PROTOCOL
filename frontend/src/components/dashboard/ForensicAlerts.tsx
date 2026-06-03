"use client";

import { motion } from "framer-motion";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  ImageIcon,
  Video,
  Mic,
  FileText,
  Link2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FORENSIC_ALERTS } from "@/lib/demo-data";

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertOctagon,
    color: "text-cyber-red",
    bg: "bg-cyber-red/10",
    border: "border-cyber-red/30",
    dot: "bg-cyber-red",
    label: "CRITICAL",
    badgeClass: "badge-danger",
  },
  high: {
    icon: AlertTriangle,
    color: "text-cyber-yellow",
    bg: "bg-cyber-yellow/10",
    border: "border-cyber-yellow/30",
    dot: "bg-cyber-yellow",
    label: "HIGH",
    badgeClass: "badge-warning",
  },
  medium: {
    icon: Info,
    color: "text-cyber-accent",
    bg: "bg-cyber-accent/10",
    border: "border-cyber-accent/30",
    dot: "bg-cyber-accent",
    label: "MEDIUM",
    badgeClass: "badge-info",
  },
};

const TYPE_ICONS = {
  image: ImageIcon,
  video: Video,
  audio: Mic,
  document: FileText,
  url: Link2,
};

export function ForensicAlerts() {
  return (
    <div className="glass-card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-cyber-border/50">
        <div className="flex items-center gap-2.5">
          <AlertOctagon className="w-4 h-4 text-cyber-red" />
          <h2 className="text-sm font-semibold text-cyber-text tracking-wide">
            AI Forensic Alerts
          </h2>
        </div>
        <span className="badge-danger text-[10px]">
          {FORENSIC_ALERTS.filter((a) => a.severity === "critical").length} Critical
        </span>
      </div>

      {/* Alert list */}
      <div className="divide-y divide-cyber-border/30">
        {FORENSIC_ALERTS.map((alert, i) => {
          const sc = SEVERITY_CONFIG[alert.severity];
          const SeverityIcon = sc.icon;
          const TypeIcon = TYPE_ICONS[alert.type as keyof typeof TYPE_ICONS];

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className={cn(
                "flex gap-3 px-5 py-4 hover:bg-cyber-surface/40 transition-colors group cursor-pointer",
                alert.severity === "critical" && "bg-cyber-red/[0.03]"
              )}
            >
              {/* Severity icon */}
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  sc.bg,
                  "border",
                  sc.border
                )}
              >
                <SeverityIcon className={cn("w-4 h-4", sc.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-cyber-text">{alert.title}</p>
                    <span className={cn(sc.badgeClass, "text-[10px]")}>{sc.label}</span>
                  </div>
                  <span className="text-[10px] text-cyber-muted shrink-0">{alert.time}</span>
                </div>
                <p className="text-[11px] text-cyber-muted-light mt-1 leading-relaxed line-clamp-2">
                  {alert.detail}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <TypeIcon className="w-3 h-3 text-cyber-muted" />
                  <span className="text-[10px] font-mono text-cyber-muted">{alert.id}</span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-cyber-muted/40 group-hover:text-cyber-accent transition-colors shrink-0 mt-1" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
