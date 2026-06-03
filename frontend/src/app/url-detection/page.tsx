"use client";

import { motion } from "framer-motion";
import { Link2, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { TrustScoreGauge } from "@/components/TrustScoreGauge";
import { ResultCard } from "@/components/ResultCard";
import { AIExplanationPanel } from "@/components/AIExplanationPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface URLAnalysisResult {
  id: string;
  url: string;
  timestamp: string;
  risk_level: string;
  trust_score: number;
  confidence_score: number;
  verdict: "real" | "fake" | "uncertain";
  ssl_valid: boolean;
  https_valid: boolean;
  redirect_count: number;
  final_url: string;
  domain_reputation: Record<string, unknown>;
  ssl_validation: Record<string, unknown>;
  threat_indicators: string[];
  forensic_reasons: Record<string, unknown>[];
  explanation: string;
  processing_time_ms: number;
}

export default function URLDetectionPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<URLAnalysisResult | null>(null);
  const [history, setHistory] = useState<URLAnalysisResult[]>([]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.url.analyze(url);
      setResult(data as URLAnalysisResult);
      setHistory((prev) => [data as URLAnalysisResult, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="URL Detection"
        subtitle="Analyze URLs for phishing, malware, and domain reputation threats"
        icon={Link2}
        badge="Live HTTP Probe"
      />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Input + gauge */}
        <div className="xl:col-span-2 space-y-6">
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleAnalyze}
            className="space-y-4"
          >
            <div className="glass-card p-6">
              <label className="block text-sm font-medium text-cyber-text mb-3">
                Enter URL to analyze
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="input-cyber mb-4"
              />
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full btn-cyber-primary inline-flex items-center justify-center gap-2",
                  loading && "opacity-60"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Analyze URL
                  </>
                )}
              </button>
            </div>
          </motion.form>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-4 border border-cyber-red/20 bg-cyber-red/10 flex items-center gap-3 text-sm text-cyber-red"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-card p-6"
          >
            <TrustScoreGauge score={result ? result.trust_score : null} />
          </motion.div>
        </div>

        {/* Results panel */}
        <div className="xl:col-span-3 space-y-6">
          {result && (
            <>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="glass-card p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-widest text-cyber-muted">
                      Analyzed URL
                    </p>
                    <p className="text-sm font-mono text-cyber-text mt-2 truncate">
                      {result.url}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium shrink-0",
                      result.verdict === "real"
                        ? "bg-cyber-green/10 text-cyber-green border border-cyber-green/20"
                        : result.verdict === "fake"
                          ? "bg-cyber-red/10 text-cyber-red border border-cyber-red/20"
                          : "bg-cyber-yellow/10 text-cyber-yellow border border-cyber-yellow/20"
                    )}
                  >
                    {result.verdict.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-cyber-surface/50 p-3">
                    <p className="text-xs text-cyber-muted">Risk Level</p>
                    <p className="text-lg font-semibold text-cyber-text mt-1">
                      {result.risk_level}
                    </p>
                  </div>
                  <div className="rounded-lg bg-cyber-surface/50 p-3">
                    <p className="text-xs text-cyber-muted">Confidence</p>
                    <p className="text-lg font-semibold text-cyber-text mt-1">
                      {result.confidence_score}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-cyber-muted">
                    Threat Indicators ({result.threat_indicators.length})
                  </p>
                  {result.threat_indicators.length > 0 ? (
                    <div className="space-y-1">
                      {result.threat_indicators.map((indicator, i) => (
                        <div
                          key={i}
                          className="text-xs text-cyber-muted-light bg-cyber-surface/40 rounded px-2 py-1"
                        >
                          • {indicator}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-cyber-muted italic">No threats detected</p>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <AIExplanationPanel explanation={result.explanation} />
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="section-title mb-4">Analysis History</h2>
        <div className="space-y-3">
          {history.length > 0 ? (
            history.map((item) => (
              <ResultCard
                key={item.id}
                filename={item.url}
                mediaType="url"
                verdict={item.verdict}
                trustScore={item.trust_score}
                timestamp={item.timestamp}
              />
            ))
          ) : (
            <p className="text-sm text-cyber-muted">No analyses yet</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
