"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Brain, Cpu, Clock, Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResultCard } from "@/components/ResultCard";
import { AudioUploadPanel } from "@/components/audio/AudioUploadPanel";
import { VoiceCloneMeter } from "@/components/audio/VoiceCloneMeter";
import { SpectrogramViewer } from "@/components/audio/SpectrogramViewer";
import { AudioForensicFindings } from "@/components/audio/AudioForensicFindings";
import { AudioMetricsPanel } from "@/components/audio/AudioMetricsPanel";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import type { AudioAnalysisResult } from "@/components/audio/types";
import { formatDate } from "@/lib/utils";

const sectionAnim = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: "easeOut" },
  }),
};

export default function AudioDetectionPage() {
  const [result, setResult] = useState<AudioAnalysisResult | null>(null);
  const [history, setHistory] = useState<AudioAnalysisResult[]>([]);

  const handleResult = (data: AudioAnalysisResult) => {
    setResult(data);
    setHistory((prev) => [data, ...prev].slice(0, 20));
  };

  const handleReset = () => setResult(null);

  return (
    <div className="space-y-6 pb-6">

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <PageHeader
          title="Audio Detection"
          subtitle="Detect AI-cloned voices, synthetic speech, and acoustic manipulation"
          icon={Mic}
          badge="Voice Biometrics"
          actions={
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-green/10 border border-cyber-green/20">
              <Cpu className="w-3.5 h-3.5 text-cyber-green" />
              <span className="text-[11px] text-cyber-green font-medium">
                ISAFE-AudioForensics-v1
              </span>
            </div>
          }
        />
      </motion.div>

      {/* ── Result verdict banner ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            key="verdict-banner"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className={`glass-card p-4 border relative overflow-hidden ${
              result.verdict === "fake"
                ? "border-cyber-red/30 bg-cyber-red/[0.04]"
                : result.verdict === "uncertain"
                ? "border-cyber-yellow/30 bg-cyber-yellow/[0.03]"
                : "border-cyber-green/30 bg-cyber-green/[0.03]"
            }`}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  result.verdict === "fake" ? "bg-cyber-red" :
                  result.verdict === "uncertain" ? "bg-cyber-yellow" : "bg-cyber-green"
                }`} />
                <span className={`text-sm font-bold tracking-widest ${
                  result.verdict === "fake" ? "text-cyber-red" :
                  result.verdict === "uncertain" ? "text-cyber-yellow" : "text-cyber-green"
                }`}>
                  {result.verdict === "fake" ? "VOICE CLONE DETECTED" :
                   result.verdict === "uncertain" ? "INCONCLUSIVE — REVIEW REQUIRED" :
                   "AUTHENTIC VOICE CONFIRMED"}
                </span>
              </div>
              <div className="flex items-center gap-4 ml-auto text-[11px] text-cyber-muted">
                <span>Trust: <span className="font-mono font-bold text-cyber-text">{result.trust_score}/100</span></span>
                <span>Confidence: <span className="font-mono font-bold text-cyber-text">{Math.round(result.confidence * 100)}%</span></span>
                <span>Clone prob: <span className={`font-mono font-bold ${
                  result.voice_clone_probability > 0.6 ? "text-cyber-red" :
                  result.voice_clone_probability > 0.3 ? "text-cyber-yellow" : "text-cyber-green"
                }`}>{Math.round(result.voice_clone_probability * 100)}%</span></span>
                <span className="font-mono text-cyber-muted/60">{result.processing_time_ms}ms</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── Left column ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Upload */}
          <motion.div custom={0} variants={sectionAnim} initial="hidden" animate="visible">
            <AudioUploadPanel onResult={handleResult} onReset={handleReset} />
          </motion.div>

          {/* Voice clone meter */}
          <motion.div custom={1} variants={sectionAnim} initial="hidden" animate="visible">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="meter-result"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                >
                  <VoiceCloneMeter
                    probability={result.voice_clone_probability}
                    confidence={result.confidence}
                    trustScore={result.trust_score}
                    verdict={result.verdict === "pending" ? "uncertain" : result.verdict}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="meter-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Mic className="w-4 h-4 text-cyber-muted" />
                    <h2 className="section-title text-cyber-muted">Voice Analysis</h2>
                  </div>
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-cyber-border flex items-center justify-center">
                      <Mic className="w-8 h-8 text-cyber-muted/30" />
                    </div>
                    <p className="text-sm text-cyber-muted text-center">
                      Upload an audio file to see voice clone probability and trust score
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Audio player (shown after analysis) */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="player"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, delay: 0.1 }}
              >
                <AudioPlayer
                  filename={result.filename}
                  duration={result.duration_seconds}
                  verdict={result.verdict === "pending" ? "uncertain" : result.verdict}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Metadata card */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="meta"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="glass-card p-5 space-y-2.5"
              >
                <p className="text-[10px] text-cyber-muted uppercase tracking-widest mb-1">
                  File Metadata
                </p>
                {[
                  { label: "Filename",     value: result.filename },
                  { label: "Duration",     value: `${result.duration_seconds.toFixed(3)}s` },
                  { label: "Sample Rate",  value: `${result.sample_rate.toLocaleString()} Hz` },
                  { label: "Model",        value: result.model_used },
                  { label: "Analyzed At",  value: formatDate(result.timestamp) },
                  { label: "Process Time", value: `${result.processing_time_ms}ms` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs gap-4">
                    <span className="text-cyber-muted shrink-0">{label}</span>
                    <span className="font-mono text-cyber-text truncate text-right">{value}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right column ── */}
        <div className="xl:col-span-3 space-y-5">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                {/* Spectrogram */}
                <SpectrogramViewer
                  spectrogram={result.spectrogram}
                  waveform={result.waveform}
                  pitchSeries={result.pitch_series}
                  duration={result.duration_seconds}
                  sampleRate={result.sample_rate}
                />

                {/* Metrics panel */}
                <AudioMetricsPanel result={result} />

                {/* Forensic findings */}
                <AudioForensicFindings
                  findings={result.forensic_findings}
                  flagCount={result.flag_count}
                />

                {/* AI Explanation */}
                <div className="glass-card overflow-hidden">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-cyber-border/50">
                    <Brain className="w-4 h-4 text-cyber-purple" />
                    <h2 className="section-title">AI Forensic Explanation</h2>
                    <span className="badge-info text-[10px] ml-auto">
                      <Cpu className="w-2.5 h-2.5" />
                      Groq · llama3-8b
                    </span>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-sm text-cyber-text leading-relaxed">
                      {result.explanation}
                    </p>
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-cyber-border/50">
                      <Clock className="w-3.5 h-3.5 text-cyber-muted" />
                      <span className="text-[11px] text-cyber-muted">
                        Generated in {result.processing_time_ms}ms · {formatDate(result.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Empty state placeholders */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {[
                  {
                    title: "Signal Analysis",
                    icon: Activity,
                    desc: "Mel spectrogram, waveform, and pitch (F0) visualizations will appear here after analysis.",
                  },
                  {
                    title: "Acoustic Metrics",
                    icon: Cpu,
                    desc: "MFCC, spectral centroid, SNR, flux, and compression metrics will be displayed.",
                  },
                  {
                    title: "Forensic Indicators",
                    icon: Mic,
                    desc: "Pitch consistency, noise mismatch, reverberation, and GAN artifact findings.",
                  },
                  {
                    title: "AI Explanation",
                    icon: Brain,
                    desc: "Groq-powered forensic explanation will be generated after audio analysis.",
                  },
                ].map((p, i) => (
                  <motion.div
                    key={p.title}
                    custom={i + 2}
                    variants={sectionAnim}
                    initial="hidden"
                    animate="visible"
                    className="glass-card p-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <p.icon className="w-4 h-4 text-cyber-muted" />
                      <h3 className="text-sm font-semibold text-cyber-muted">{p.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-surface/50 border border-cyber-border/30">
                      <div className="w-8 h-8 rounded-lg bg-cyber-card border border-cyber-border flex items-center justify-center shrink-0">
                        <p.icon className="w-4 h-4 text-cyber-muted/40" />
                      </div>
                      <p className="text-sm text-cyber-muted">{p.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Analysis History ── */}
      <motion.div
        custom={6}
        variants={sectionAnim}
        initial="hidden"
        animate="visible"
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyber-accent" />
            <h2 className="section-title">Analysis History</h2>
          </div>
          {history.length > 0 && (
            <span className="text-[11px] text-cyber-muted">
              {history.length} record{history.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item) => (
              <ResultCard
                key={item.id}
                filename={item.filename}
                mediaType="audio"
                verdict={item.verdict}
                trustScore={item.trust_score}
                timestamp={formatDate(item.timestamp)}
                onClick={() => setResult(item)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ResultCard
                key={i}
                filename="—"
                mediaType="audio"
                verdict="pending"
                trustScore={0}
                timestamp="—"
                placeholder
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
