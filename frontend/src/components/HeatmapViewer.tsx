"use client";

import { motion } from "framer-motion";
import { Eye, ZoomIn, ZoomOut, RotateCcw, Layers } from "lucide-react";

interface HeatmapViewerProps {
  imageUrl?: string;
  heatmapUrl?: string;
  regions?: Array<{ x: number; y: number; w: number; h: number; score: number }>;
}

export function HeatmapViewer({ imageUrl, heatmapUrl, regions }: HeatmapViewerProps) {
  const hasContent = imageUrl || heatmapUrl;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyber-accent" />
          <h2 className="section-title">Forensic Heatmap</h2>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {[
            { icon: ZoomIn, label: "Zoom in" },
            { icon: ZoomOut, label: "Zoom out" },
            { icon: RotateCcw, label: "Reset" },
            { icon: Layers, label: "Toggle overlay" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              aria-label={label}
              className="p-1.5 rounded-lg text-cyber-muted hover:text-cyber-accent hover:bg-cyber-card transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Viewer area */}
      <div className="relative rounded-xl overflow-hidden bg-cyber-surface border border-cyber-border aspect-video flex items-center justify-center">
        {hasContent ? (
          <div className="relative w-full h-full">
            {/* Base image */}
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Analyzed media"
                className="w-full h-full object-contain"
              />
            )}
            {/* Heatmap overlay */}
            {heatmapUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heatmapUrl}
                alt="Manipulation heatmap"
                className="absolute inset-0 w-full h-full object-contain opacity-60 mix-blend-screen"
              />
            )}
            {/* Region annotations */}
            {regions?.map((region, i) => (
              <div
                key={i}
                className="absolute border-2 border-cyber-red rounded"
                style={{
                  left: `${region.x}%`,
                  top: `${region.y}%`,
                  width: `${region.w}%`,
                  height: `${region.h}%`,
                }}
              >
                <span className="absolute -top-5 left-0 text-[10px] bg-cyber-red text-white px-1 rounded">
                  {Math.round(region.score * 100)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-3 p-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-cyber-card border border-cyber-border flex items-center justify-center mx-auto">
              <Eye className="w-7 h-7 text-cyber-muted opacity-40" />
            </div>
            <div>
              <p className="text-sm text-cyber-muted">No media analyzed yet</p>
              <p className="text-xs text-cyber-muted/60 mt-1">
                Upload a file to view the forensic heatmap
              </p>
            </div>
          </motion.div>
        )}

        {/* Scan line animation overlay */}
        {!hasContent && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            <motion.div
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-accent/30 to-transparent"
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <p className="text-[11px] text-cyber-muted">Manipulation probability:</p>
        <div className="flex items-center gap-1 flex-1">
          <span className="text-[10px] text-cyber-green">Low</span>
          <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-cyber-green via-cyber-yellow to-cyber-red" />
          <span className="text-[10px] text-cyber-red">High</span>
        </div>
      </div>
    </div>
  );
}
