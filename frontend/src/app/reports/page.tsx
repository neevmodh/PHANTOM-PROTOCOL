"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Filter,
  FileDown,
  RefreshCw,
  Download,
  FileCode2,
  FileJson,
  Sparkles,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResultCard } from "@/components/ResultCard";
import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Verdict } from "@/lib/types";

type GeneratedReport = {
  report_id: string;
  formats: Array<"pdf" | "json">;
  generated_at?: string;
  size_bytes?: number;
};

type RecentScan = {
  id: string;
  media_type: string;
  filename: string;
  timestamp: string;
  trust_score: number;
  verdict: Verdict;
  model_used?: string;
};

const sectionAnim = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" },
  }),
};

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportList, recentList] = await Promise.all([
        api.reports.list(),
        api.analytics.recent(12),
      ]);
      setReports(reportList as GeneratedReport[]);
      setRecentScans(recentList as RecentScan[]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter(
      (report) =>
        report.report_id.toLowerCase().includes(query) ||
        report.formats.join(",").toLowerCase().includes(query)
    );
  }, [reports, search]);

  const handleGenerate = async (scan: RecentScan) => {
    setGeneratingId(scan.id);
    setError(null);
    try {
      await api.reports.generate(scan.id, scan.media_type);
      await loadData();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Report generation failed.");
    } finally {
      setGeneratingId(null);
    }
  };

  const totalGenerated = reports.length;

  return (
    <div className="space-y-6 pb-6 relative isolate">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 right-[-8%] w-80 h-80 rounded-full bg-cyber-accent/10 blur-3xl" />
        <div className="absolute top-52 left-[-8%] w-72 h-72 rounded-full bg-cyber-purple/10 blur-3xl" />
        <div className="absolute inset-0 cyber-grid-bg opacity-35" />
      </div>

      <PageHeader
        title="Reports Center"
        subtitle="Generate and download enterprise forensic reports in JSON and PDF"
        icon={FileText}
        badge="Report Generation"
        actions={
          <button onClick={() => void loadData()} className="btn-cyber text-xs px-4 py-2 flex items-center gap-2">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="glass-card p-4 border border-cyber-red/20 bg-cyber-red/10 flex items-center gap-2 text-sm text-cyber-red">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 border border-cyber-border/50">
          <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Generated reports</p>
          <p className="text-2xl font-bold font-mono text-cyber-text mt-2">{totalGenerated}</p>
          <p className="text-xs text-cyber-muted-light mt-1">JSON and PDF outputs stored internally</p>
        </div>
        <div className="glass-card p-5 border border-cyber-border/50">
          <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Recent scans</p>
          <p className="text-2xl font-bold font-mono text-cyber-text mt-2">{recentScans.length}</p>
          <p className="text-xs text-cyber-muted-light mt-1">Ready for report generation</p>
        </div>
        <div className="glass-card p-5 border border-cyber-border/50">
          <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Available formats</p>
          <p className="text-2xl font-bold font-mono text-cyber-text mt-2">PDF + JSON</p>
          <p className="text-xs text-cyber-muted-light mt-1">Downloadable enterprise reporting package</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <motion.div custom={0} variants={sectionAnim} initial="hidden" animate="visible" className="xl:col-span-4 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">Search Reports</h2>
                <p className="text-xs text-cyber-muted-light mt-1">Filter by report id or format.</p>
              </div>
              <Search className="w-4 h-4 text-cyber-accent" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reports..."
                className="input-cyber pl-9"
              />
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-cyber-muted">
              <Filter className="w-3.5 h-3.5" />
              <span>PDF and JSON outputs are grouped by report id.</span>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">Generated Report Library</h2>
                <p className="text-xs text-cyber-muted-light mt-1">Internal storage remains hidden; only downloads are exposed.</p>
              </div>
              <FileDown className="w-4 h-4 text-cyber-green" />
            </div>

            <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-cyber-border/40 bg-cyber-surface/50 p-4 opacity-50">
                      <div className="h-4 w-2/3 bg-cyber-border rounded mb-3" />
                      <div className="h-3 w-1/3 bg-cyber-border rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <div key={report.report_id} className="rounded-xl border border-cyber-border/40 bg-cyber-surface/55 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-cyber-text truncate">Report {report.report_id}</p>
                        <p className="text-xs text-cyber-muted mt-1">Generated {report.generated_at ? formatDate(report.generated_at) : "—"}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {report.formats.includes("json") && <span className="badge-info text-[10px]"><FileJson className="w-2.5 h-2.5" />JSON</span>}
                        {report.formats.includes("pdf") && <span className="badge-safe text-[10px]"><FileCode2 className="w-2.5 h-2.5" />PDF</span>}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-cyber-muted">
                      <span>{formatBytes(report.size_bytes)}</span>
                      <div className="flex items-center gap-2">
                        <a className="btn-cyber text-[11px] px-3 py-1.5 flex items-center gap-1.5" href={api.reports.download(report.report_id, "json")} target="_blank" rel="noreferrer">
                          <Download className="w-3.5 h-3.5" />JSON
                        </a>
                        <a className="btn-cyber-primary text-[11px] px-3 py-1.5 flex items-center gap-1.5" href={api.reports.download(report.report_id, "pdf")} target="_blank" rel="noreferrer">
                          <FileDown className="w-3.5 h-3.5" />PDF
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-surface/50 border border-cyber-border/30 text-sm text-cyber-muted">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-cyber-green" />
                  No generated reports yet.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div custom={1} variants={sectionAnim} initial="hidden" animate="visible" className="xl:col-span-8 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">Generate Reports</h2>
                <p className="text-xs text-cyber-muted-light mt-1">Select a recent scan to generate both PDF and JSON outputs.</p>
              </div>
              <Clock3 className="w-4 h-4 text-cyber-accent" />
            </div>

            <div className="space-y-3">
              {recentScans.length > 0 ? (
                recentScans.map((scan) => (
                  <div key={scan.id} className="rounded-xl border border-cyber-border/40 bg-cyber-surface/50 p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-cyber-text truncate">{scan.filename}</p>
                      <p className="text-xs text-cyber-muted mt-1">
                        {scan.media_type.toUpperCase()} · Trust {Math.round(scan.trust_score)}/100 · {scan.verdict.toUpperCase()} · {formatDate(scan.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => void handleGenerate(scan)}
                        disabled={generatingId === scan.id}
                        className="btn-cyber-primary text-xs px-4 py-2 flex items-center gap-2"
                      >
                        {generatingId === scan.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Generate PDF + JSON
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-surface/50 border border-cyber-border/30 text-sm text-cyber-muted">
                  <Clock3 className="w-4 h-4 shrink-0" />
                  No recent scans are available for report generation.
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">Recent Scan Snapshot</h2>
                <p className="text-xs text-cyber-muted-light mt-1">Scan history that can be promoted into a formal report.</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-cyber-green" />
            </div>

            <div className="space-y-3">
              {recentScans.slice(0, 6).map((scan) => (
                <ResultCard
                  key={scan.id}
                  filename={scan.filename}
                  mediaType={scan.media_type as any}
                  verdict={scan.verdict}
                  trustScore={Math.round(scan.trust_score)}
                  timestamp={formatDate(scan.timestamp)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}