"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
  FileScan,
  Shield,
  ShieldAlert,
  ScrollText,
  Eye,
  FileType,
} from "lucide-react";
import { TrustScoreGauge } from "@/components/TrustScoreGauge";
import { AIExplanationPanel } from "@/components/AIExplanationPanel";
import { ResultCard } from "@/components/ResultCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";
import { cn, formatDate, scoreToVerdict } from "@/lib/utils";
import type { Severity, Verdict, ForensicExplanationReport } from "@/lib/types";

type DocumentResponse = {
  id: string;
  filename: string;
  file_path: string;
  timestamp: string;
  trust_score: number;
  verdict: Verdict;
  confidence: number;
  ai_generated_probability: number;
  ocr_consistency: number;
  metadata_mismatch: number | { score: number; detail: string };
  formatting_anomalies: number | { score: number; detail: string };
  semantic_consistency: number;
  suspicious_structure: number | { score: number; detail: string };
  forensic_indicators: Array<{
    indicator: string;
    severity: Severity | string;
    detail: string;
    score: number;
  }>;
  explanation_report?: ForensicExplanationReport;
  explanation: string;
  model_used: string;
  processing_time_ms: number;
  document_type?: "pdf" | "docx" | "txt" | "unknown";
  preview_text?: string;
};

type HistoryRow = {
  id: string;
  filename: string;
  timestamp: string;
  trust_score: number;
  verdict: Verdict;
};

const sectionAnim = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" },
  }),
};

function scoreTone(score: number) {
  if (score >= 75) {
    return { label: "CLEAR", color: "text-cyber-green", badge: "badge-safe", bar: "bg-cyber-green" };
  }
  if (score >= 50) {
    return { label: "FLAGGED", color: "text-cyber-yellow", badge: "badge-warning", bar: "bg-cyber-yellow" };
  }
  return { label: "HIGH RISK", color: "text-cyber-red", badge: "badge-danger", bar: "bg-cyber-red" };
}

function normalizeMetric(value: number | { score: number; detail: string } | undefined): number {
  if (typeof value === "number") return value;
  if (value && typeof value.score === "number") return value.score;
  return 0;
}

function normalizeDetail(value: number | { score: number; detail: string } | undefined): string {
  if (value && typeof value === "object") return value.detail;
  if (typeof value === "number") return value > 0.15 ? "Signal detected" : "No meaningful mismatch";
  return "No signal";
}

function toHistoryRow(row: Record<string, unknown>): HistoryRow {
  const trustScore = Number(row.trust_score ?? 0);
  const verdictRaw = String(row.verdict ?? "uncertain") as Verdict;
  const verdict = ["real", "fake", "uncertain", "pending"].includes(verdictRaw)
    ? verdictRaw
    : scoreToVerdict(trustScore);

  return {
    id: String(row.id ?? crypto.randomUUID()),
    filename: String(row.filename ?? "—"),
    timestamp: String(row.timestamp ?? "—"),
    trust_score: Number.isFinite(trustScore) ? trustScore : 0,
    verdict,
  };
}

export default function DocumentDetectionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DocumentResponse | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const rows = (await api.document.history()) as Array<Record<string, unknown>>;
      setHistory(rows.map(toHistoryRow).slice(0, 20));
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const tone = result ? scoreTone(result.trust_score) : null;
  const aiProbability = result ? Math.round(result.ai_generated_probability * 100) : 0;
  const forensicItems = useMemo(() => result?.forensic_indicators ?? [], [result]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError("Choose a PDF, DOCX, or TXT file to analyze.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = (await api.document.analyze(formData)) as DocumentResponse;
      setResult(response);
      setHistory((prev) => [
        {
          id: response.id,
          filename: response.filename,
          timestamp: response.timestamp,
          trust_score: response.trust_score,
          verdict: response.verdict,
        },
        ...prev.filter((item) => item.id !== response.id),
      ].slice(0, 20));
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Document analysis failed.");
    } finally {
      setUploading(false);
    }
  };

  const selectedPreview = result?.preview_text || "Upload a document to inspect preview text, metadata, readability, and manipulation signals.";

  return (
    <div className="space-y-6 pb-6 relative isolate">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 right-[-8%] w-80 h-80 rounded-full bg-cyber-accent/10 blur-3xl" />
        <div className="absolute top-48 left-[-10%] w-72 h-72 rounded-full bg-cyber-purple/10 blur-3xl" />
        <div className="absolute inset-0 cyber-grid-bg opacity-40" />
      </div>

      <PageHeader
        title="Document Authenticity"
        subtitle="Detect AI-written documents, metadata tampering, OCR drift, and structural manipulation"
        icon={FileText}
        badge="NLP + Forensics"
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-accent/10 border border-cyber-accent/20">
            <FileScan className="w-3.5 h-3.5 text-cyber-accent" />
            <span className="text-[11px] text-cyber-accent font-medium">ISAFE-DocForensics-v1</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-6">
          <motion.div
            custom={0}
            variants={sectionAnim}
            initial="hidden"
            animate="visible"
            className="glass-card p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="section-title">Upload Document</h2>
                <p className="text-sm text-cyber-muted-light mt-1">
                  Supports PDF, DOCX, DOC, and TXT. The analyzer extracts text, OCR, and metadata signals.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-surface border border-cyber-border/50">
                <Upload className="w-3.5 h-3.5 text-cyber-accent" />
                <span className="text-[11px] text-cyber-muted uppercase tracking-widest">Private</span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block text-xs text-cyber-muted uppercase tracking-widest">
                Target file
              </label>
              <label className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-all duration-200", file ? "border-cyber-accent bg-cyber-accent/5" : "border-cyber-border hover:border-cyber-accent hover:bg-cyber-surface/40") }>
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <div className="w-14 h-14 rounded-2xl bg-cyber-accent/10 border border-cyber-accent/20 flex items-center justify-center">
                  <FileType className="w-6 h-6 text-cyber-accent" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-cyber-text">
                    {file ? file.name : "Drop document here or browse"}
                  </p>
                  <p className="text-xs text-cyber-muted">PDF, DOCX, DOC, TXT · Max 50 MB</p>
                </div>
              </label>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-cyber-red/20 bg-cyber-red/10 text-sm text-cyber-red">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="btn-cyber-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {uploading ? "Analyzing Document" : "Analyze Document"}
              </button>
            </form>
          </motion.div>

          <motion.div
            custom={1}
            variants={sectionAnim}
            initial="hidden"
            animate="visible"
            className="glass-card p-6"
          >
            <TrustScoreGauge score={result ? result.trust_score : null} />
          </motion.div>

          <motion.div
            custom={2}
            variants={sectionAnim}
            initial="hidden"
            animate="visible"
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">Document Preview</h2>
                <p className="text-xs text-cyber-muted-light mt-1">Preview excerpt rendered from the analyzed file.</p>
              </div>
              <Eye className="w-4 h-4 text-cyber-accent" />
            </div>

            <div className="rounded-2xl border border-cyber-border/40 bg-cyber-surface/60 p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className={cn("px-2.5 py-1 rounded-full border", result ? "border-cyber-accent/20 bg-cyber-accent/10 text-cyber-accent" : "border-cyber-border text-cyber-muted")}>
                  {result?.document_type?.toUpperCase() ?? "PREVIEW"}
                </span>
                {file && <span className="text-cyber-muted">{file.name}</span>}
              </div>
              <div className="max-h-80 overflow-auto rounded-xl border border-cyber-border/30 bg-cyber-bg/60 p-4">
                <pre className="whitespace-pre-wrap text-sm leading-6 text-cyber-text font-sans">
                  {selectedPreview}
                </pre>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="xl:col-span-8 space-y-6">
          <AnimatePresence>
            {result && tone && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className={cn("glass-card p-4 border", result.trust_score >= 75 ? "border-cyber-green/20 bg-cyber-green/10" : result.trust_score >= 50 ? "border-cyber-yellow/20 bg-cyber-yellow/10" : "border-cyber-red/20 bg-cyber-red/10")}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", tone.bar)} />
                    <span className={cn("text-sm font-bold tracking-widest", tone.color)}>{tone.label}</span>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-4 text-[11px] text-cyber-muted">
                    <span>AI probability: <span className="font-mono font-bold text-cyber-text">{aiProbability}%</span></span>
                    <span>Confidence: <span className="font-mono font-bold text-cyber-text">{Math.round(result.confidence)}%</span></span>
                    <span>Processing: <span className="font-mono font-bold text-cyber-text">{result.processing_time_ms}ms</span></span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div custom={3} variants={sectionAnim} initial="hidden" animate="visible" className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="section-title">AI-Generated Probability</h2>
                  <p className="text-xs text-cyber-muted-light mt-1">Estimate of synthetic or machine-authored content.</p>
                </div>
                <Sparkles className="w-4 h-4 text-cyber-accent" />
              </div>
              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-cyber-border/40 bg-cyber-surface/60 p-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-cyber-muted">Probability</p>
                      <p className={cn("text-2xl font-bold font-mono mt-1", result.ai_generated_probability >= 0.6 ? "text-cyber-red" : result.ai_generated_probability >= 0.35 ? "text-cyber-yellow" : "text-cyber-green")}>
                        {aiProbability}%
                      </p>
                    </div>
                    <span className={tone?.badge}>{result.verdict.toUpperCase()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-cyber-border overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", aiProbability >= 60 ? "bg-cyber-red" : aiProbability >= 35 ? "bg-cyber-yellow" : "bg-cyber-green")}
                      initial={{ width: 0 }}
                      animate={{ width: `${aiProbability}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-surface/50 border border-cyber-border/30 text-sm text-cyber-muted">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  AI-probability scoring will appear after a scan.
                </div>
              )}
            </motion.div>

            <motion.div custom={4} variants={sectionAnim} initial="hidden" animate="visible" className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="section-title">Metadata Analysis</h2>
                  <p className="text-xs text-cyber-muted-light mt-1">Mismatch and structure checks from document properties.</p>
                </div>
                <BadgeCheck className="w-4 h-4 text-cyber-accent" />
              </div>
              {result ? (
                <div className="space-y-3 text-sm">
                  {[
                    { label: "OCR consistency", value: result.ocr_consistency, detail: `${Math.round(result.ocr_consistency * 100)}% alignment` },
                    { label: "Metadata mismatch", value: normalizeMetric(result.metadata_mismatch), detail: normalizeDetail(result.metadata_mismatch) },
                    { label: "Formatting anomalies", value: normalizeMetric(result.formatting_anomalies), detail: normalizeDetail(result.formatting_anomalies) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-cyber-border/40 bg-cyber-surface/60 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-cyber-muted">{item.label}</span>
                        <span className="font-mono text-cyber-text">{Math.round(item.value * 100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-cyber-border overflow-hidden">
                        <motion.div
                          className={cn("h-full rounded-full", item.value < 0.35 ? "bg-cyber-green" : item.value < 0.65 ? "bg-cyber-yellow" : "bg-cyber-red")}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(item.value * 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-xs text-cyber-muted-light">{item.detail}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-surface/50 border border-cyber-border/30 text-sm text-cyber-muted">
                  <ScrollText className="w-4 h-4 shrink-0" />
                  Metadata signals will populate after analysis.
                </div>
              )}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div custom={5} variants={sectionAnim} initial="hidden" animate="visible" className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="section-title">Readability Analysis</h2>
                  <p className="text-xs text-cyber-muted-light mt-1">Semantic continuity and line-level structure review.</p>
                </div>
                <Shield className="w-4 h-4 text-cyber-accent" />
              </div>
              {result ? (
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Semantic consistency", value: result.semantic_consistency },
                    { label: "OCR consistency", value: result.ocr_consistency },
                    { label: "Suspicious structure", value: normalizeMetric(result.suspicious_structure) },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-cyber-muted">{item.label}</span>
                        <span className="font-mono text-cyber-text">{Math.round(item.value * 100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-cyber-border overflow-hidden">
                        <motion.div
                          className={cn("h-full rounded-full", item.value < 0.35 ? "bg-cyber-red" : item.value < 0.65 ? "bg-cyber-yellow" : "bg-cyber-green")}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(item.value * 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-surface/50 border border-cyber-border/30 text-sm text-cyber-muted">
                  <FileText className="w-4 h-4 shrink-0" />
                  Readability metrics will appear after the first scan.
                </div>
              )}
            </motion.div>

            <motion.div custom={6} variants={sectionAnim} initial="hidden" animate="visible" className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="section-title">Plagiarism-Style Indicators</h2>
                  <p className="text-xs text-cyber-muted-light mt-1">Repetition, templating, and outline signatures.</p>
                </div>
                <ShieldAlert className="w-4 h-4 text-cyber-red" />
              </div>
              {forensicItems.length > 0 ? (
                <div className="space-y-3">
                  {forensicItems.map((item) => (
                    <div key={item.indicator} className="rounded-lg border border-cyber-border/40 bg-cyber-surface/60 p-3 flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        <AlertTriangle className={cn("w-4 h-4", item.severity === "critical" || item.severity === "high" ? "text-cyber-red" : "text-cyber-yellow")} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-cyber-text">{item.indicator}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-cyber-border/40 text-cyber-muted uppercase tracking-widest">
                            {item.severity}
                          </span>
                        </div>
                        <p className="text-xs text-cyber-muted-light">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : result ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-surface/50 border border-cyber-border/30 text-sm text-cyber-muted">
                  <BadgeCheck className="w-4 h-4 shrink-0 text-cyber-green" />
                  No high-confidence plagiarism-style indicators were found.
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-surface/50 border border-cyber-border/30 text-sm text-cyber-muted">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  Indicator set will be populated after analysis.
                </div>
              )}
            </motion.div>
          </div>

          <motion.div custom={7} variants={sectionAnim} initial="hidden" animate="visible">
            <AIExplanationPanel
              explanation={result?.explanation}
              modelName="ISAFE-DocForensics-v1"
              processingTime={result?.processing_time_ms}
              report={result?.explanation_report}
              items={forensicItems.map((item) => ({
                label: item.indicator,
                value: item.detail,
                confidence: Math.min(0.99, Math.max(0.25, item.score / 100)),
                type: item.severity === "critical" || item.severity === "high" ? "negative" : item.severity === "medium" ? "neutral" : "positive",
              }))}
            />
          </motion.div>
        </div>
      </div>

      <motion.div custom={8} variants={sectionAnim} initial="hidden" animate="visible" className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="section-title">Analysis History</h2>
            <p className="text-xs text-cyber-muted-light mt-1">Internal CSV-backed record of recent document scans.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadHistory()}
            className="btn-cyber text-xs px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", historyLoading && "animate-spin")} />
            Refresh History
          </button>
        </div>

        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item) => (
              <ResultCard
                key={item.id}
                filename={item.filename}
                mediaType="document"
                verdict={item.verdict}
                trustScore={item.trust_score}
                timestamp={formatDate(item.timestamp)}
              />
            ))}
          </div>
        ) : historyLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map((index) => (
              <ResultCard
                key={index}
                filename="Loading scan history"
                mediaType="document"
                verdict="pending"
                trustScore={0}
                timestamp="—"
                placeholder
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-surface/50 border border-cyber-border/30 text-sm text-cyber-muted">
            <RefreshCw className="w-4 h-4 shrink-0" />
            No document scans recorded yet.
          </div>
        )}
      </motion.div>
    </div>
  );
}
