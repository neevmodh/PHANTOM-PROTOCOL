"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, ShieldCheck, ShieldAlert, Shield, Clock, Zap } from "lucide-react";
import { UploadPanel } from "@/components/UploadPanel";
import { TrustScoreGauge } from "@/components/TrustScoreGauge";
import { ResultCard } from "@/components/ResultCard";
import { HeatmapViewer } from "@/components/HeatmapViewer";
import { AIExplanationPanel } from "@/components/AIExplanationPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ForensicFinding {
  indicator: string;
  severity: "critical" | "high" | "medium" | "low";
  detail: string;
  score: number;
}

interface ImageResult {
  id: string;
  filename: string;
  verdict: "real" | "fake" | "uncertain";
  confidence: number;
  trust_score: number;
  flag_count: number;
  forensic_findings: ForensicFinding[];
  heatmap_url: string;
  image_url: string;
  explanation: string;
  model_used: string;
  processing_time_ms: number;
  timestamp: string;
}

interface HistoryRecord {
  id: string;
  filename: string;
  verdict: "real" | "fake" | "uncertain" | "pending";
  trust_score: string | number;
  timestamp: string;
}

const VERDICT_META = {
  real:      { label: "Authentic",  icon: ShieldCheck, color: "text-cyber-green",  bg: "bg-cyber-green/10",  border: "border-cyber-green/30"  },
  fake:      { label: "Synthetic",  icon: ShieldAlert, color: "text-cyber-red",    bg: "bg-cyber-red/10",    border: "border-cyber-red/30"    },
  uncertain: { label: "Uncertain",  icon: Shield,      color: "text-cyber-yellow", bg: "bg-cyber-yellow/10", border: "border-cyber-yellow/30" },
};

const SEV_COLOR: Record<string, string> = {
  critical: "bg-cyber-red",
  high:     "bg-cyber-red",
  medium:   "bg-cyber-yellow",
  low:      "bg-cyber-green",
};
const SEV_TEXT: Record<string, string> = {
  critical: "text-cyber-red border-cyber-red/40",
  high:     "text-cyber-red border-cyber-red/30",
  medium:   "text-cyber-yellow border-cyber-yellow/30",
  low:      "text-cyber-green border-cyber-green/30",
};

export default function ImageDetectionPage() {
  const [result, setResult] = useState<ImageResult | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    api.image
      .history()
      .then((data) => {
        const rows = (data as HistoryRecord[]).slice().reverse().slice(0, 10);
        setHistory(rows);
      })
      .catch(() => {});
  }, []);

  const handleResult = useCallback((data: unknown) => {
    const raw = data as Record<string, unknown>;

    // Coerce all numeric fields defensively — backend returns numbers but be safe
    const r: ImageResult = {
      id:                  String(raw.id ?? ""),
      filename:            String(raw.filename ?? "unknown"),
      verdict:             (raw.verdict as ImageResult["verdict"]) ?? "uncertain",
      confidence:          Number(raw.confidence ?? 0),
      trust_score:         Number(raw.trust_score ?? 0),
      flag_count:          Number(raw.flag_count ?? 0),
      forensic_findings:   Array.isArray(raw.forensic_findings) ? (raw.forensic_findings as ForensicFinding[]) : [],
      heatmap_url:         String(raw.heatmap_url ?? ""),
      image_url:           String(raw.image_url ?? ""),
      explanation:         String(raw.explanation ?? ""),
      model_used:          String(raw.model_used ?? "ISAFE-Forensics-v1"),
      processing_time_ms:  Number(raw.processing_time_ms ?? 0),
      timestamp:           String(raw.timestamp ?? new Date().toISOString()),
    };

    setResult(r);
    setHistory((prev) => [
      { id: r.id, filename: r.filename, verdict: r.verdict, trust_score: r.trust_score, timestamp: r.timestamp },
      ...prev.slice(0, 9),
    ]);
  }, []);

  // Prefix relative /uploads/... paths with backend base URL
  const imageUrl   = result?.image_url   ? `${BASE_URL}${result.image_url}`   : undefined;
  const heatmapUrl = result?.heatmap_url ? `${BASE_URL}${result.heatmap_url}` : undefined;

  const verdictMeta = result ? VERDICT_META[result.verdict] : null;

  const explanationItems = result?.forensic_findings?.map((f) => ({
    label:      f.indicator,
    value:      f.detail,
    confidence: f.score,
    type: (f.severity === "critical" || f.severity === "high"
      ? "negative"
      : f.severity === "medium"
      ? "neutral"
      : "positive") as "positive" | "negative" | "neutral",
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Image Detection"
        subtitle="Analyze images for deepfake, GAN-generated, or manipulated content"
        icon={ImageIcon}
        badge="CNN + ELA Analysis"
      />

      {/* ── Result summary banner (appears after analysis) ── */}
      <AnimatePresence>
        {result && verdictMeta && (
          <motion.div
            key="result-banner"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 ${verdictMeta.bg} ${verdictMeta.border}`}
          >
            <verdictMeta.icon className={`w-6 h-6 shrink-0 ${verdictMeta.color}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${verdictMeta.color}`}>
                {verdictMeta.label} — {result.filename}
              </p>
              <p className="text-xs text-cyber-muted-light mt-0.5">
                Trust score {result.trust_score}/100 · Confidence {Math.round(result.confidence * 100)}% · {result.flag_count} flag{result.flag_count !== 1 ? "s" : ""} raised
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-cyber-muted shrink-0">
              <Zap className="w-3.5 h-3.5" />
              {result.processing_time_ms}ms
            </div>
            <div className="flex items-center gap-2 text-xs text-cyber-muted shrink-0">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(result.timestamp)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── Left column: upload + gauge + findings ── */}
        <div className="xl:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <UploadPanel
              accept="image/jpeg,image/png,image/webp,image/gif"
              label="Drop image here or click to browse"
              hint="Supports JPG, PNG, WEBP, GIF · Max 50 MB"
              endpoint="/api/image/analyze"
              onResult={handleResult}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-card p-6"
          >
            <TrustScoreGauge score={result !== null ? result.trust_score : null} />
          </motion.div>

          {/* Forensic findings list */}
          <AnimatePresence>
            {result && result.forensic_findings.length > 0 && (
              <motion.div
                key="findings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                className="glass-card p-6 space-y-3"
              >
                <h2 className="section-title">Forensic Findings</h2>
                <div className="space-y-2">
                  {result.forensic_findings.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-cyber-surface/50 border border-cyber-border/30"
                    >
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${SEV_COLOR[f.severity] ?? "bg-cyber-muted"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-cyber-text">{f.indicator}</p>
                        <p className="text-xs text-cyber-muted-light mt-0.5 leading-relaxed">{f.detail}</p>
                        {/* Score bar */}
                        <div className="h-1 bg-cyber-border rounded-full mt-2 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${SEV_COLOR[f.severity] ?? "bg-cyber-muted"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round(f.score * 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
                          />
                        </div>
                      </div>
                      <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border ${SEV_TEXT[f.severity] ?? "text-cyber-muted border-cyber-border"}`}>
                        {f.severity}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-1 flex items-center justify-between text-xs text-cyber-muted border-t border-cyber-border/30">
                  <span>{result.flag_count} flag{result.flag_count !== 1 ? "s" : ""} raised</span>
                  <span className="font-mono">{result.processing_time_ms}ms · {result.model_used}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right column: heatmap + explanation ── */}
        <div className="xl:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <HeatmapViewer imageUrl={imageUrl} heatmapUrl={heatmapUrl} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <AIExplanationPanel
              explanation={result?.explanation}
              modelName={result?.model_used}
              processingTime={result?.processing_time_ms}
              items={explanationItems}
            />
          </motion.div>
        </div>
      </div>

      {/* ── History ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="section-title mb-4">Analysis History</h2>
        <div className="space-y-3">
          {history.length > 0 ? (
            history.map((record) => (
              <ResultCard
                key={record.id}
                filename={record.filename || "unknown"}
                mediaType="image"
                verdict={record.verdict ?? "pending"}
                trustScore={Number(record.trust_score) || 0}
                timestamp={formatDate(record.timestamp)}
              />
            ))
          ) : (
            [1, 2, 3].map((i) => (
              <ResultCard
                key={i}
                filename="—"
                mediaType="image"
                verdict="pending"
                trustScore={0}
                timestamp="—"
                placeholder
              />
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
