"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Brain, Cpu, Clock, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { TrustScoreGauge } from "@/components/TrustScoreGauge";
import { ResultCard } from "@/components/ResultCard";
import { VideoUploadPanel } from "@/components/video/VideoUploadPanel";
import { VideoResultHeader } from "@/components/video/VideoResultHeader";
import { FrameTimeline } from "@/components/video/FrameTimeline";
import { TemporalScorePanel } from "@/components/video/TemporalScorePanel";
import { VideoForensicFindings } from "@/components/video/VideoForensicFindings";
import type { VideoAnalysisResult } from "@/components/video/VideoUploadPanel";
import { formatDate } from "@/lib/utils";

const sectionAnim = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" },
  }),
};

export default function VideoDetectionPage() {
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [history, setHistory] = useState<VideoAnalysisResult[]>([]);

  const handleResult = (data: VideoAnalysisResult) => {
    setResult(data);
    setHistory((prev) => [data, ...prev].slice(0, 20));
  };

  const handleReset = () => setResult(null);

  return (
    <div className="space-y-6 pb-6">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <PageHeader
          title="Video Detection"
          subtitle="Frame-by-frame deepfake and synthetic video analysis with temporal forensics"
          icon={Video}
          badge="Temporal Analysis"
          actions={
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-purple/10 border border-cyber-purple/20">
              <Cpu className="w-3.5 h-3.5 text-cyber-purple" />
              <span className="text-[11px] text-cyber-purple font-medium">ISAFE-VideoForensics-v1</span>
            </div>
          }
        />
      </motion.div>

      {/* ── Result header (shown after analysis) ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            key="result-header"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <VideoResultHeader result={result} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── Left column: upload + trust gauge ── */}
        <div className="xl:col-span-2 space-y-6">
          <motion.div custom={0} variants={sectionAnim} initial="hidden" animate="visible">
            <VideoUploadPanel onResult={handleResult} onReset={handleReset} />
          </motion.div>

          <motion.div custom={1} variants={sectionAnim} initial="hidden" animate="visible" className="glass-card p-6">
            <TrustScoreGauge score={result ? result.trust_score : null} />
          </motion.div>

          {/* Video metadata card (shown after analysis) */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="meta"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35 }}
                className="glass-card p-5 space-y-3"
              >
                <p className="text-[10px] text-cyber-muted uppercase tracking-widest">Video Metadata</p>
                {[
                  { label: "Duration", value: `${result.duration_seconds.toFixed(2)}s` },
                  { label: "Frame Rate", value: `${result.fps} fps` },
                  { label: "Total Frames", value: result.total_frames.toLocaleString() },
                  { label: "Frames Analyzed", value: result.frames_analyzed },
                  { label: "Suspicious Frames", value: `${result.suspicious_frames} (${Math.round(result.suspicious_frames / Math.max(result.frames_analyzed, 1) * 100)}%)` },
                  { label: "Processing Time", value: `${result.processing_time_ms}ms` },
                  { label: "Analyzed At", value: formatDate(result.timestamp) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-cyber-muted">{label}</span>
                    <span className="font-mono text-cyber-text">{value}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right column: results ── */}
        <div className="xl:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Temporal score panel */}
                <TemporalScorePanel result={result} />

                {/* Frame timeline */}
                <FrameTimeline
                  timeline={result.frame_timeline}
                  savedFrames={result.saved_frames}
                  totalFrames={result.total_frames}
                  suspiciousCount={result.suspicious_frames}
                />

                {/* Forensic findings */}
                <VideoForensicFindings
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
                    <p className="text-sm text-cyber-text leading-relaxed">{result.explanation}</p>
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
              /* Empty state */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Placeholder panels */}
                {[
                  { title: "Temporal Forensics", icon: Video, desc: "Frame-by-frame ELA, optical flow, and GAN artifact scores will appear here." },
                  { title: "Frame Timeline", icon: Clock, desc: "Per-frame anomaly timeline and key frame thumbnails will be displayed after analysis." },
                  { title: "AI Explanation", icon: Brain, desc: "Groq-powered forensic explanation will be generated after video analysis." },
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
      <motion.div custom={5} variants={sectionAnim} initial="hidden" animate="visible" className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyber-accent" />
            <h2 className="section-title">Analysis History</h2>
          </div>
          {history.length > 0 && (
            <span className="text-[11px] text-cyber-muted">{history.length} record{history.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item) => (
              <ResultCard
                key={item.id}
                filename={item.filename}
                mediaType="video"
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
                mediaType="video"
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
