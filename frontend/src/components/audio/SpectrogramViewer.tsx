"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpectrogramViewerProps {
  spectrogram: number[][];   // [mel_bands][time_steps] — 0 to 1
  waveform: number[];
  pitchSeries: number[];
  duration: number;
  sampleRate: number;
}

type ViewMode = "spectrogram" | "waveform" | "pitch";

// Jet colormap: value 0-1 → RGB
function jetColor(v: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, v));
  const r = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * t - 3)));
  const g = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * t - 2)));
  const b = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * t - 1)));
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function SpectrogramCanvas({ spectrogram }: { spectrogram: number[][] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spectrogram.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const timeSteps = spectrogram.length;
    const melBands = spectrogram[0]?.length ?? 0;
    if (!melBands) return;

    canvas.width = timeSteps;
    canvas.height = melBands;

    const imgData = ctx.createImageData(timeSteps, melBands);
    for (let t = 0; t < timeSteps; t++) {
      for (let m = 0; m < melBands; m++) {
        const val = spectrogram[t]?.[m] ?? 0;
        const [r, g, b] = jetColor(val);
        // Flip mel axis (low freq at bottom)
        const y = melBands - 1 - m;
        const idx = (y * timeSteps + t) * 4;
        imgData.data[idx]     = r;
        imgData.data[idx + 1] = g;
        imgData.data[idx + 2] = b;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [spectrogram]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

function WaveformCanvas({ waveform }: { waveform: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveform.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.offsetWidth || 600;
    const H = canvas.offsetHeight || 120;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "rgba(10,22,40,0.8)";
    ctx.fillRect(0, 0, W, H);

    // Center line
    ctx.strokeStyle = "rgba(0,212,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    // Waveform
    const step = Math.max(1, Math.floor(waveform.length / W));
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 4;
    ctx.beginPath();

    for (let x = 0; x < W; x++) {
      const idx = Math.floor((x / W) * waveform.length);
      const sample = waveform[idx] ?? 0;
      const y = H / 2 - (sample * H * 0.45);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [waveform]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

function PitchCanvas({ pitchSeries }: { pitchSeries: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pitchSeries.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.offsetWidth || 600;
    const H = canvas.offsetHeight || 120;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(10,22,40,0.8)";
    ctx.fillRect(0, 0, W, H);

    const voiced = pitchSeries.filter((v) => v > 0);
    if (!voiced.length) return;

    const minF0 = Math.min(...voiced);
    const maxF0 = Math.max(...voiced);
    const range = maxF0 - minF0 || 1;

    // Grid lines
    ctx.strokeStyle = "rgba(153,69,255,0.1)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (i / 4) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Pitch dots
    pitchSeries.forEach((f0, i) => {
      if (f0 <= 0) return;
      const x = (i / pitchSeries.length) * W;
      const y = H - ((f0 - minF0) / range) * (H * 0.85) - H * 0.075;
      ctx.fillStyle = "#9945ff";
      ctx.shadowColor = "#9945ff";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [pitchSeries]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

export function SpectrogramViewer({
  spectrogram, waveform, pitchSeries, duration, sampleRate,
}: SpectrogramViewerProps) {
  const [mode, setMode] = useState<ViewMode>("spectrogram");

  const tabs: { id: ViewMode; label: string; color: string }[] = [
    { id: "spectrogram", label: "Mel Spectrogram", color: "text-cyber-accent" },
    { id: "waveform",    label: "Waveform",         color: "text-cyber-green" },
    { id: "pitch",       label: "Pitch (F0)",        color: "text-cyber-purple" },
  ];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyber-green" />
          <h2 className="section-title">Signal Analysis</h2>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-cyber-muted">
          <span>{duration.toFixed(2)}s</span>
          <span className="mx-1 opacity-40">·</span>
          <span>{(sampleRate / 1000).toFixed(1)} kHz</span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 bg-cyber-surface/60 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={cn(
              "flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150",
              mode === tab.id
                ? `${tab.color} bg-cyber-card shadow-sm`
                : "text-cyber-muted hover:text-cyber-text"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Viewer */}
      <motion.div
        key={mode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative rounded-xl overflow-hidden bg-cyber-surface border border-cyber-border"
        style={{ height: 160 }}
      >
        {mode === "spectrogram" && spectrogram.length > 0 && (
          <SpectrogramCanvas spectrogram={spectrogram} />
        )}
        {mode === "waveform" && waveform.length > 0 && (
          <WaveformCanvas waveform={waveform} />
        )}
        {mode === "pitch" && pitchSeries.length > 0 && (
          <PitchCanvas pitchSeries={pitchSeries} />
        )}

        {/* Empty state */}
        {((mode === "spectrogram" && !spectrogram.length) ||
          (mode === "waveform" && !waveform.length) ||
          (mode === "pitch" && !pitchSeries.length)) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-cyber-muted">No data available</p>
          </div>
        )}

        {/* Scan line */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-accent/20 to-transparent"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </motion.div>

      {/* Legend */}
      {mode === "spectrogram" && (
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] text-cyber-muted">Low energy</span>
          <div className="flex-1 h-2 rounded-full" style={{
            background: "linear-gradient(to right, #000080, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)"
          }} />
          <span className="text-[10px] text-cyber-muted">High energy</span>
        </div>
      )}
      {mode === "pitch" && (
        <p className="text-[10px] text-cyber-muted mt-2">
          Each dot = voiced frame · Vertical axis = F0 frequency (Hz)
        </p>
      )}
    </div>
  );
}
