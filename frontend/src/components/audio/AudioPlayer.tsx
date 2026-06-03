"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, SkipBack } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  filename: string;
  duration: number;
  verdict: "real" | "fake" | "uncertain";
}

const VERDICT_COLOR = {
  fake: "text-cyber-red",
  uncertain: "text-cyber-yellow",
  real: "text-cyber-green",
};

const VERDICT_BAR = {
  fake: "bg-cyber-red",
  uncertain: "bg-cyber-yellow",
  real: "bg-cyber-green",
};

export function AudioPlayer({ filename, duration, verdict }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate playback (no actual audio src — just UI demo)
  const tick = useCallback(() => {
    setCurrentTime((t) => {
      if (t >= duration) { setPlaying(false); return 0; }
      return t + 0.1;
    });
  }, [duration]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(tick, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, tick]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="w-4 h-4 text-cyber-green" />
        <h2 className="text-sm font-semibold text-cyber-text">Audio Preview</h2>
        <span className={cn("ml-auto text-[10px] font-mono", VERDICT_COLOR[verdict])}>
          {verdict.toUpperCase()}
        </span>
      </div>

      {/* Filename */}
      <p className="text-xs text-cyber-muted truncate mb-4">{filename}</p>

      {/* Animated waveform bars (decorative) */}
      <div className="flex items-center justify-center gap-0.5 h-10 mb-4">
        {Array.from({ length: 48 }).map((_, i) => {
          const h = 20 + Math.sin(i * 0.7) * 14 + Math.cos(i * 1.3) * 8;
          const active = (i / 48) * 100 <= pct;
          return (
            <motion.div
              key={i}
              className={cn(
                "w-1 rounded-full transition-colors duration-150",
                active ? VERDICT_BAR[verdict] : "bg-cyber-border"
              )}
              style={{ height: `${h}%` }}
              animate={playing && active ? { scaleY: [1, 1.3, 0.8, 1.1, 1] } : { scaleY: 1 }}
              transition={{ duration: 0.4, repeat: playing ? Infinity : 0, delay: i * 0.02 }}
            />
          );
        })}
      </div>

      {/* Progress bar */}
      <div
        className="relative h-1.5 bg-cyber-border rounded-full mb-3 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          setCurrentTime(ratio * duration);
        }}
      >
        <motion.div
          className={cn("absolute top-0 left-0 h-full rounded-full", VERDICT_BAR[verdict])}
          style={{ width: `${pct}%` }}
        />
        <motion.div
          className={cn("absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-cyber-bg", VERDICT_BAR[verdict])}
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>

      {/* Time */}
      <div className="flex justify-between text-[10px] text-cyber-muted mb-4">
        <span>{fmt(currentTime)}</span>
        <span>{fmt(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setCurrentTime(0)}
          className="p-2 rounded-lg text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface transition-colors"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={() => setPlaying((v) => !v)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150",
            "border-2", `border-${verdict === "fake" ? "cyber-red" : verdict === "uncertain" ? "cyber-yellow" : "cyber-green"}`,
            playing ? "bg-cyber-green/20" : "hover:bg-cyber-surface"
          )}
        >
          {playing
            ? <Pause className={cn("w-4 h-4", VERDICT_COLOR[verdict])} />
            : <Play className={cn("w-4 h-4 ml-0.5", VERDICT_COLOR[verdict])} />
          }
        </button>

        <button
          onClick={() => setMuted((v) => !v)}
          className="p-2 rounded-lg text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface transition-colors"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-center text-[10px] text-cyber-muted/50 mt-3">
        Preview UI · Connect audio src for playback
      </p>
    </div>
  );
}
