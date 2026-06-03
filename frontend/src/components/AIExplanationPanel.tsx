"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, ChevronUp, Info, Cpu, ShieldAlert, ShieldCheck, Shield, Sparkles, FileSearch } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ForensicExplanationReport } from "@/lib/types";

interface ExplanationItem {
  label: string;
  value: string;
  confidence?: number;
  type?: "positive" | "negative" | "neutral";
}

interface AIExplanationPanelProps {
  explanation?: string;
  modelName?: string;
  processingTime?: number;
  items?: ExplanationItem[];
  report?: ForensicExplanationReport;
}

function severityTone(severity: string) {
  if (severity === "critical") {
    return { badge: "badge-danger", dot: "bg-cyber-red", accent: "text-cyber-red" };
  }
  if (severity === "high") {
    return { badge: "badge-danger", dot: "bg-cyber-red", accent: "text-cyber-red" };
  }
  if (severity === "medium") {
    return { badge: "badge-warning", dot: "bg-cyber-yellow", accent: "text-cyber-yellow" };
  }
  return { badge: "badge-safe", dot: "bg-cyber-green", accent: "text-cyber-green" };
}

export function AIExplanationPanel({
  explanation,
  modelName,
  processingTime,
  items,
  report,
}: AIExplanationPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const hasData = report || explanation || (items && items.length > 0);
  const reportTone = report ? severityTone(report.severity_assessment.level) : null;

  return (
    <div className="glass-card overflow-hidden border border-cyber-border/50">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-6 hover:bg-cyber-surface/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyber-accent/10 border border-cyber-accent/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-cyber-accent" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="section-title">Explainable AI Forensic Brief</h2>
              {modelName && (
                <span className="badge-info text-[10px]">
                  <Cpu className="w-2.5 h-2.5" />
                  {modelName}
                </span>
              )}
              {report?.generated_by && (
                <span className={cn("text-[10px] px-2 py-1 rounded-full border uppercase tracking-widest", report.generated_by === "groq" ? "border-cyber-green/20 bg-cyber-green/10 text-cyber-green" : "border-cyber-border/40 bg-cyber-surface/50 text-cyber-muted") }>
                  {report.generated_by === "groq" ? "Groq" : "Fallback"}
                </span>
              )}
            </div>
            <p className="text-xs text-cyber-muted-light mt-1">
              Human-readable rationale, suspicious findings, and trust assessment.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {processingTime !== undefined && (
            <span className="text-xs text-cyber-muted">{processingTime}ms</span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-cyber-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-cyber-muted" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4">
              {hasData ? (
                <>
                  {report && reportTone && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/60 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className={cn("w-4 h-4", reportTone.accent)} />
                          <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Severity</p>
                        </div>
                        <p className={cn("text-lg font-semibold", reportTone.accent)}>{report.severity_assessment.badge}</p>
                        <p className="text-xs text-cyber-muted-light mt-1">{report.severity_assessment.summary}</p>
                      </div>
                      <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/60 p-4 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-cyber-accent" />
                          <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Human-readable explanation</p>
                        </div>
                        <p className="text-sm text-cyber-text leading-relaxed">{report.human_readable_explanation}</p>
                      </div>
                    </div>
                  )}

                  {explanation && !report && (
                    <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border/50">
                      <p className="text-sm text-cyber-text leading-relaxed">{explanation}</p>
                    </div>
                  )}

                  {report && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileSearch className="w-4 h-4 text-cyber-accent" />
                          <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Threat reasoning</p>
                        </div>
                        <p className="text-sm text-cyber-text leading-relaxed">{report.threat_reasoning}</p>
                      </div>
                      <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-cyber-accent" />
                          <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Trust analysis</p>
                        </div>
                        <p className="text-sm text-cyber-text leading-relaxed">{report.trust_analysis_summary}</p>
                      </div>
                    </div>
                  )}

                  {report?.key_suspicious_findings && report.key_suspicious_findings.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-cyber-red" />
                        <p className="text-xs uppercase tracking-widest text-cyber-muted">Highlighted suspicious findings</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {report.key_suspicious_findings.map((finding, index) => {
                          const tone = severityTone(finding.severity);
                          return (
                            <motion.div
                              key={`${finding.title}-${index}`}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="rounded-xl border border-cyber-border/40 bg-cyber-surface/60 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-cyber-text">{finding.title}</span>
                                    <span className={tone.badge}>{finding.severity}</span>
                                  </div>
                                  <p className="text-sm text-cyber-muted-light mt-1 leading-relaxed">{finding.detail}</p>
                                </div>
                                <span className="text-[10px] text-cyber-muted shrink-0">
                                  {Math.round(finding.confidence * 100)}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-cyber-border rounded-full mt-3 overflow-hidden">
                                <motion.div
                                  className={cn("h-full rounded-full", tone.dot)}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max(20, finding.confidence * 100)}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Feature items */}
                  {items && items.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Supporting forensic signals</p>
                      {items.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-cyber-surface/50 border border-cyber-border/30"
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                              item.type === "positive"
                                ? "bg-cyber-green"
                                : item.type === "negative"
                                ? "bg-cyber-red"
                                : "bg-cyber-accent"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium text-cyber-muted-light">
                                {item.label}
                              </p>
                              {item.confidence !== undefined && (
                                <span className="text-[10px] text-cyber-muted shrink-0">
                                  {Math.round(item.confidence * 100)}%
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-cyber-text mt-0.5">{item.value}</p>
                            {item.confidence !== undefined && (
                              <div className="h-0.5 bg-cyber-border rounded-full mt-1.5 overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full ${
                                    item.type === "positive"
                                      ? "bg-cyber-green"
                                      : item.type === "negative"
                                      ? "bg-cyber-red"
                                      : "bg-cyber-accent"
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.confidence * 100}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Empty state */
                <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-surface/50 border border-cyber-border/30">
                  <Info className="w-4 h-4 text-cyber-muted shrink-0" />
                  <p className="text-sm text-cyber-muted">
                    AI explanation will appear here after analysis is complete.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
