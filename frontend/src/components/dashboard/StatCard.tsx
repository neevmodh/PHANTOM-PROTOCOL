"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  accentColor: "accent" | "red" | "green" | "yellow" | "purple";
  suffix?: string;
  index?: number;
}

const COLOR_MAP = {
  accent: {
    text: "text-cyber-accent",
    bg: "bg-cyber-accent/10",
    border: "border-cyber-accent/25",
    glow: "shadow-cyber-sm",
    ring: "bg-cyber-accent",
    gradient: "from-cyber-accent/20 to-transparent",
  },
  red: {
    text: "text-cyber-red",
    bg: "bg-cyber-red/10",
    border: "border-cyber-red/25",
    glow: "shadow-danger-glow",
    ring: "bg-cyber-red",
    gradient: "from-cyber-red/20 to-transparent",
  },
  green: {
    text: "text-cyber-green",
    bg: "bg-cyber-green/10",
    border: "border-cyber-green/25",
    glow: "shadow-safe-glow",
    ring: "bg-cyber-green",
    gradient: "from-cyber-green/20 to-transparent",
  },
  yellow: {
    text: "text-cyber-yellow",
    bg: "bg-cyber-yellow/10",
    border: "border-cyber-yellow/25",
    glow: "",
    ring: "bg-cyber-yellow",
    gradient: "from-cyber-yellow/20 to-transparent",
  },
  purple: {
    text: "text-cyber-purple",
    bg: "bg-cyber-purple/10",
    border: "border-cyber-purple/25",
    glow: "",
    ring: "bg-cyber-purple",
    gradient: "from-cyber-purple/20 to-transparent",
  },
};

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  accentColor,
  suffix,
  index = 0,
}: StatCardProps) {
  const c = COLOR_MAP[accentColor];
  const isPositiveDelta = delta !== undefined && delta > 0;
  const isNegativeDelta = delta !== undefined && delta < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={cn(
        "glass-card relative overflow-hidden p-5 border",
        c.border,
        "group cursor-default"
      )}
    >
      {/* Corner glow */}
      <div
        className={cn(
          "absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-30 transition-opacity duration-300 group-hover:opacity-50",
          c.bg
        )}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl", c.bg, "border", c.border)}>
          <Icon className={cn("w-5 h-5", c.text)} />
        </div>

        {delta !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full",
              isPositiveDelta
                ? "bg-cyber-green/10 text-cyber-green"
                : isNegativeDelta
                ? "bg-cyber-red/10 text-cyber-red"
                : "bg-cyber-muted/10 text-cyber-muted"
            )}
          >
            {isPositiveDelta ? (
              <TrendingUp className="w-3 h-3" />
            ) : isNegativeDelta ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            {delta > 0 ? "+" : ""}
            {delta}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className="space-y-1">
        <motion.p
          key={String(value)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.07 + 0.15 }}
          className={cn("text-3xl font-bold font-mono tracking-tight", c.text)}
        >
          {value}
          {suffix && (
            <span className="text-lg font-medium ml-0.5 opacity-70">{suffix}</span>
          )}
        </motion.p>
        <p className="text-xs text-cyber-muted uppercase tracking-widest font-medium">
          {label}
        </p>
        {deltaLabel && (
          <p className="text-[11px] text-cyber-muted/70">{deltaLabel}</p>
        )}
      </div>

      {/* Bottom accent bar */}
      <motion.div
        className={cn("absolute bottom-0 left-0 h-0.5 rounded-full", c.ring)}
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 0.8, delay: index * 0.07 + 0.3, ease: "easeOut" }}
      />
    </motion.div>
  );
}
