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
  Clock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MediaType = "image" | "video" | "audio" | "document" | "url";
type Verdict = "real" | "fake" | "pending" | "uncertain";

const MEDIA_ICONS: Record<MediaType, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: Mic,
  document: FileText,
  url: Link2,
};

const VERDICT_CONFIG: Record<
  Verdict,
  { label: string; badgeClass: string; icon: React.ElementType; color: string }
> = {
  real: {
    label: "Authentic",
    badgeClass: "badge-safe",
    icon: ShieldCheck,
    color: "text-cyber-green",
  },
  fake: {
    label: "Synthetic",
    badgeClass: "badge-danger",
    icon: ShieldAlert,
    color: "text-cyber-red",
  },
  uncertain: {
    label: "Uncertain",
    badgeClass: "badge-warning",
    icon: Clock,
    color: "text-cyber-yellow",
  },
  pending: {
    label: "Pending",
    badgeClass: "badge-info",
    icon: Clock,
    color: "text-cyber-accent",
  },
};

interface ResultCardProps {
  filename: string;
  mediaType: MediaType;
  verdict: Verdict;
  trustScore: number;
  timestamp: string;
  placeholder?: boolean;
  onClick?: () => void;
}

export function ResultCard({
  filename,
  mediaType,
  verdict,
  trustScore,
  timestamp,
  placeholder = false,
  onClick,
}: ResultCardProps) {
  const MediaIcon = MEDIA_ICONS[mediaType];
  const verdictConfig = VERDICT_CONFIG[verdict];
  const VerdictIcon = verdictConfig.icon;

  return (
    <motion.div
      whileHover={{ x: 2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border border-cyber-border/50",
        "bg-cyber-surface/50 hover:bg-cyber-card hover:border-cyber-border",
        "transition-all duration-150 group",
        onClick && "cursor-pointer",
        placeholder && "opacity-40"
      )}
    >
      {/* Media type icon */}
      <div className="w-9 h-9 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-center shrink-0">
        <MediaIcon className="w-4 h-4 text-cyber-muted-light" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cyber-text truncate">{filename}</p>
        <p className="text-xs text-cyber-muted mt-0.5">{timestamp}</p>
      </div>

      {/* Trust score */}
      <div className="text-right shrink-0">
        <p className={cn("text-sm font-bold font-mono", verdictConfig.color)}>
          {placeholder ? "—" : `${trustScore}`}
        </p>
        <p className="text-[10px] text-cyber-muted">score</p>
      </div>

      {/* Verdict badge */}
      <div className="shrink-0">
        <span className={verdictConfig.badgeClass}>
          <VerdictIcon className="w-3 h-3" />
          {verdictConfig.label}
        </span>
      </div>

      {/* Arrow */}
      {onClick && (
        <ChevronRight className="w-4 h-4 text-cyber-muted group-hover:text-cyber-accent transition-colors shrink-0" />
      )}
    </motion.div>
  );
}
