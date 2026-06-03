"use client";

import { type ElementType, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart2,
  Activity,
  TrendingUp,
  Shield,
  AlertTriangle,
  PieChart,
  RefreshCw,
  Clock3,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { ResultCard } from "@/components/ResultCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { Verdict } from "@/lib/types";

type DashboardPayload = {
  summary: {
    overall: {
      total_analyses: number;
      flagged: number;
      clean: number;
      pending: number;
      avg_trust_score: number;
      avg_confidence: number;
      latest_timestamp?: string;
      fake_rate: number;
    };
    verdict_counts: Record<Verdict, number>;
    totals: Record<string, { total: number; flagged: number; clean: number; pending: number; avg_trust_score: number }>;
    risk_distribution: Array<{ range: string; label: string; color: string; count: number }>;
  };
  trends: Array<{ date: string; fake: number; real: number; pending: number; uncertain?: number }>;
  breakdown: Array<{ type: string; count: number; flagged: number; avg_trust_score: number }>;
  risk_distribution: Array<{ range: string; label: string; color: string; count: number }>;
  content_types: Array<{ type: string; count: number; flagged: number; clean: number; avg_trust_score: number; share: number }>;
  recent: Array<{
    id: string;
    media_type: string;
    filename: string;
    timestamp: string;
    trust_score: number;
    confidence: number;
    verdict: Verdict;
    model_used: string;
    processing_time_ms: number;
  }>;
  activity_timeline: Array<{ date: string; scans: number }>;
};

const CARD_VARIANTS = {
  total: "accent",
  flagged: "red",
  avg: "green",
  rate: "purple",
} as const;

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#0d1f3c",
  border: "1px solid #1a3a5c",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay: i * 0.08, ease: "easeOut" },
  }),
};

function StatCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: ElementType; tone: keyof typeof CARD_VARIANTS }) {
  const style =
    tone === "total"
      ? "border-cyber-accent/20 bg-cyber-accent/10 text-cyber-accent"
      : tone === "flagged"
      ? "border-cyber-red/20 bg-cyber-red/10 text-cyber-red"
      : tone === "avg"
      ? "border-cyber-green/20 bg-cyber-green/10 text-cyber-green"
      : "border-cyber-purple/20 bg-cyber-purple/10 text-cyber-purple";

  return (
    <div className="glass-card p-5 border border-cyber-border/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-cyber-muted">{label}</p>
          <p className="text-2xl font-bold font-mono text-cyber-text mt-2">{value}</p>
          <p className="text-xs text-cyber-muted-light mt-1">{detail}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", style)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function SeverityBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-cyber-muted">{label}</span>
        <span className="font-mono text-cyber-text">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-cyber-border overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function ActivityTimeline({ data }: { data: Array<{ date: string; scans: number }> }) {
  const peak = Math.max(...data.map((item) => item.scans), 1);
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock3 className="w-4 h-4 text-cyber-accent" />
          <h2 className="text-sm font-semibold text-cyber-text tracking-wide">Recent Activity Timeline</h2>
        </div>
        <span className="text-[11px] text-cyber-muted">14 days</span>
      </div>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.date} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-[11px] text-cyber-muted">{item.date.slice(5)}</span>
            <div className="flex-1 h-2 rounded-full bg-cyber-border/80 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyber-accent via-cyber-purple to-cyber-green"
                initial={{ width: 0 }}
                animate={{ width: `${(item.scans / peak) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="w-10 text-right font-mono text-xs text-cyber-text">{item.scans}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RangeTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { label: string; color: string } }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={CHART_TOOLTIP_STYLE} className="px-3 py-2 shadow-glass">
      <p className="text-[11px] text-cyber-muted mb-1">Risk range: {label}</p>
      <p className="text-sm font-semibold" style={{ color: item.payload.color }}>{item.payload.label}</p>
      <p className="text-xs text-cyber-text mt-0.5">
        <span className="font-mono font-bold">{item.value}</span> detections
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.analytics.dashboard()) as DashboardPayload;
      setDashboard(data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load analytics dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const contentPieData = useMemo(
    () =>
      (dashboard?.content_types ?? []).map((item, index) => ({
        name: item.type,
        value: item.share,
        color: ["#00d4ff", "#9945ff", "#00ff88", "#ffcc00", "#ff3366"][index % 5],
      })),
    [dashboard]
  );

  const verdictSeries = useMemo(() => {
    if (!dashboard) return [];
    const summary = dashboard.summary.verdict_counts;
    return [
      { name: "Real", value: summary.real ?? 0, color: "#00ff88" },
      { name: "Fake", value: summary.fake ?? 0, color: "#ff3366" },
      { name: "Uncertain", value: summary.uncertain ?? 0, color: "#ffcc00" },
      { name: "Pending", value: summary.pending ?? 0, color: "#00d4ff" },
    ];
  }, [dashboard]);

  const topContentTypes = dashboard?.content_types.slice(0, 5) ?? [];

  return (
    <div className="space-y-6 pb-6 relative isolate">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 right-[-8%] w-80 h-80 rounded-full bg-cyber-accent/10 blur-3xl" />
        <div className="absolute top-56 left-[-10%] w-72 h-72 rounded-full bg-cyber-purple/10 blur-3xl" />
        <div className="absolute inset-0 cyber-grid-bg opacity-40" />
      </div>

      <PageHeader
        title="Analytics Command Center"
        subtitle="CSV-backed threat intelligence, verdict mix, and operational scan activity"
        icon={BarChart2}
        badge="Live Metrics"
        actions={
          <button onClick={() => void loadDashboard()} className="btn-cyber text-xs px-4 py-2 flex items-center gap-2">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="glass-card p-4 border border-cyber-red/20 bg-cyber-red/10 flex items-center gap-2 text-sm text-cyber-red">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Analyses"
          value={String(dashboard?.summary.overall.total_analyses ?? 0)}
          detail="All scanned artifacts across media types"
          icon={Activity}
          tone="total"
        />
        <StatCard
          label="High Risk / Fake"
          value={String(dashboard?.summary.overall.flagged ?? 0)}
          detail={`${dashboard?.summary.overall.fake_rate ?? 0}% of total scans`}
          icon={AlertTriangle}
          tone="flagged"
        />
        <StatCard
          label="Average Trust Score"
          value={`${dashboard?.summary.overall.avg_trust_score ?? 0}/100`}
          detail="Cross-module trust posture"
          icon={Shield}
          tone="avg"
        />
        <StatCard
          label="Avg Confidence"
          value={`${dashboard?.summary.overall.avg_confidence ?? 0}/100`}
          detail="Aggregate analyzer certainty"
          icon={TrendingUp}
          tone="rate"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible" className="xl:col-span-3 glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-cyber-accent" />
            <h2 className="section-title">Threat Trend Charts</h2>
          </div>
          <AnalyticsChart variant="line" data={dashboard?.trends ?? []} height={260} />
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            {verdictSeries.map((item) => (
              <div key={item.name} className="rounded-lg border border-cyber-border/40 bg-cyber-surface/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-cyber-muted">{item.name}</span>
                  <span className="font-mono font-semibold" style={{ color: item.color }}>{item.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-cyber-border mt-2 overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, item.value * 2)}%` }} transition={{ duration: 0.9 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible" className="xl:col-span-2 glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-4 h-4 text-cyber-purple" />
            <h2 className="section-title">Fake vs Real Statistics</h2>
          </div>
          <div className="space-y-3">
            {verdictSeries.map((item) => (
              <SeverityBar key={item.name} label={item.name} value={item.value} color={item.color} />
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-cyber-border/40 bg-cyber-surface/50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-cyber-muted mb-3">Verdict breakdown</p>
            <div className="flex items-end gap-3 h-24">
              {verdictSeries.map((item) => (
                <div key={item.name} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    className="w-full rounded-t-lg"
                    style={{ backgroundColor: item.color }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(100, item.value * 2)}%` }}
                    transition={{ duration: 0.85 }}
                  />
                  <span className="text-[10px] text-cyber-muted">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="xl:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyber-purple" />
              <h2 className="section-title">Risk Distribution</h2>
            </div>
            <span className="text-[11px] text-cyber-muted">{dashboard?.summary.overall.total_analyses ?? 0} total</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dashboard?.risk_distribution ?? []} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.5)" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<RangeTooltip />} cursor={{ fill: "rgba(0,212,255,0.04)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {(dashboard?.risk_distribution ?? []).map((entry) => (
                  <Cell key={entry.range} fill={entry.color} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {(dashboard?.risk_distribution ?? []).map((item) => (
              <div key={item.range} className="flex items-center gap-2 rounded-lg border border-cyber-border/30 bg-cyber-surface/50 px-3 py-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-cyber-muted truncate">{item.label}</span>
                <span className="ml-auto text-[10px] font-mono font-semibold" style={{ color: item.color }}>{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible" className="xl:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyber-accent" />
              <h2 className="section-title">Content Type Analysis</h2>
            </div>
            <span className="text-[11px] text-cyber-muted">Media mix and average trust</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-5 items-center">
            <div className="relative w-[180px] h-[180px] mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={contentPieData} cx="50%" cy="50%" innerRadius={56} outerRadius={82} paddingAngle={4} dataKey="value">
                    {contentPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number, name: string) => [`${value}%`, name]} />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: "#94a3b8", fontSize: "11px" }}>{value}</span>} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold font-mono text-cyber-text">{dashboard?.summary.overall.total_analyses ?? 0}</p>
                <p className="text-[9px] text-cyber-muted uppercase tracking-widest">scans</p>
              </div>
            </div>

            <div className="space-y-3">
              {topContentTypes.map((item, index) => (
                <div key={item.type} className="rounded-lg border border-cyber-border/40 bg-cyber-surface/50 p-3">
                  <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: contentPieData[index]?.color ?? "#00d4ff" }} />
                      <span className="text-cyber-text capitalize">{item.type}</span>
                    </div>
                    <span className="font-mono text-cyber-muted">{item.count} scans</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-cyber-border overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: contentPieData[index]?.color ?? "#00d4ff" }} initial={{ width: 0 }} animate={{ width: `${item.share}%` }} transition={{ duration: 0.8 }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-cyber-muted">
                    <span>Avg trust: <span className="font-mono text-cyber-text">{item.avg_trust_score}/100</span></span>
                    <span>Flagged: <span className="font-mono text-cyber-text">{item.flagged}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible">
          <ActivityTimeline data={dashboard?.activity_timeline ?? []} />
        </motion.div>

        <motion.div custom={5} variants={sectionVariants} initial="hidden" animate="visible" className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyber-green" />
              <h2 className="section-title">Scan History</h2>
            </div>
            <span className="text-[11px] text-cyber-muted">Most recent 12</span>
          </div>
          <div className="space-y-3">
            {dashboard?.recent?.length ? (
              dashboard.recent.map((record) => (
                <ResultCard
                  key={record.id}
                  filename={record.filename}
                  mediaType={record.media_type as any}
                  verdict={record.verdict}
                  trustScore={Math.round(record.trust_score)}
                  timestamp={formatDate(record.timestamp)}
                />
              ))
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-surface/50 border border-cyber-border/30 text-sm text-cyber-muted">
                <Clock3 className="w-4 h-4 shrink-0" />
                No scans are available yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div custom={6} variants={sectionVariants} initial="hidden" animate="visible" className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Dashboard Summary</h2>
            <p className="text-xs text-cyber-muted-light mt-1">Aggregated directly from the CSV histories behind the platform.</p>
          </div>
          <span className="text-[11px] text-cyber-muted">Latest scan: {dashboard?.summary.overall.latest_timestamp ? formatDate(dashboard.summary.overall.latest_timestamp) : "—"}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Clean / authentic</p>
            <p className="text-2xl font-bold font-mono text-cyber-green mt-2">{dashboard?.summary.overall.clean ?? 0}</p>
          </div>
          <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Pending</p>
            <p className="text-2xl font-bold font-mono text-cyber-accent mt-2">{dashboard?.summary.overall.pending ?? 0}</p>
          </div>
          <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Fake rate</p>
            <p className="text-2xl font-bold font-mono text-cyber-red mt-2">{dashboard?.summary.overall.fake_rate ?? 0}%</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="grid grid-cols-4 gap-2 text-[10px] uppercase tracking-widest text-cyber-muted mb-2">
            <span>Real</span>
            <span>Fake</span>
            <span>Uncertain</span>
            <span>Pending</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {verdictSeries.map((item) => (
              <div key={item.name} className="rounded-lg border border-cyber-border/40 bg-cyber-surface/50 p-3">
                <div className="text-lg font-bold font-mono" style={{ color: item.color }}>{item.value}</div>
                <div className="h-1.5 rounded-full bg-cyber-border mt-2 overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, item.value * 2)}%` }} transition={{ duration: 0.8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}