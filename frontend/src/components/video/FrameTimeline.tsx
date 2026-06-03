"use client";

import { motion } from "framer-motion";
import { Film, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FrameTimelinePoint, SavedFrame } from "./VideoUploadPanel";

interface FrameTimelineProps {
  timeline: FrameTimelinePoint[];
  savedFrames: SavedFrame[];
  totalFrames: number;
  suspiciousCount: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function FrameTimeline({
  timeline,
  savedFrames,
  totalFrames,
  suspiciousCount,
}: FrameTimelineProps) {
  const maxEla = Math.max(...timeline.map((t) => t.ela), 1);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-cyber-purple" />
          <h2 className="section-title">Frame Analysis</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge-danger text-[10px]">
            <AlertTriangle className="w-2.5 h-2.5" />
            {suspiciousCount} suspicious
          </span>
          <span className="badge-info text-[10px]">
            {timeline.length} / {totalFrames} frames
          </span>
        </div>
      </div>

      {/* ELA timeline bar chart */}
      <div className="mb-5">
        <p className="text-[10px] text-cyber-muted uppercase tracking-widest mb-2">
          ELA Score per Frame
        </p>
        <div className="flex items-end gap-px h-16 bg-cyber-surface/50 rounded-lg p-2 overflow-hidden">
          {timeline.map((pt, i) => {
            const h = Math.max(4, (pt.ela / maxEla) * 100);
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.4, delay: i * 0.008, ease: "easeOut" }}
                className={cn(
                  "flex-1 min-w-[2px] rounded-sm",
                  pt.suspicious ? "bg-cyber-red" : "bg-cyber-accent/60"
                )}
                title={`Frame ${pt.index}: ELA=${pt.ela.toFixed(2)}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-cyber-muted mt-1">
          <span>Frame 0</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyber-red inline-block" /> Suspicious</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyber-accent/60 inline-block" /> Normal</span>
          </div>
          <span>Frame {totalFrames}</span>
        </div>
      </div>

      {/* Saved frame thumbnails */}
      {savedFrames.length > 0 && (
        <div>
          <p className="text-[10px] text-cyber-muted uppercase tracking-widest mb-3">
            Key Frames
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {savedFrames.map((frame, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className={cn(
                  "relative rounded-lg overflow-hidden border-2 aspect-video bg-cyber-surface",
                  frame.suspicious ? "border-cyber-red/60" : "border-cyber-border/50"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${API_BASE}${frame.url}`}
                  alt={`Frame ${frame.frame_index}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-cyber-bg/80 to-transparent" />
                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-cyber-muted-light">
                    #{frame.frame_index}
                  </span>
                  {frame.suspicious ? (
                    <AlertTriangle className="w-3 h-3 text-cyber-red" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-cyber-green" />
                  )}
                </div>
                {/* ELA badge */}
                <div className={cn(
                  "absolute top-1 right-1 text-[9px] font-mono px-1 rounded",
                  frame.suspicious ? "bg-cyber-red/80 text-white" : "bg-cyber-surface/80 text-cyber-muted-light"
                )}>
                  {frame.ela_score.toFixed(1)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
