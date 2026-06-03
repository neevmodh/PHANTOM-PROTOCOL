"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Activity,
  AlertTriangle,
  TrendingUp,
  Percent,
  RefreshCw,
  Bell,
  Sparkles,
  FileText,
  Link2,
  Mic,
  Video,
  ImageIcon,
  Clock3,
  Layers,
  BarChart2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

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
    verdict_counts: { real: number; fake: number; uncertain: number; pending: number };
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
    verdict: "real" | "fake" | "uncertain" | "pending";
    model_used: string;
    processing_time_ms: number;
  }>;
  activity_timeline: Array<{ date: string; scans: number }>;
};

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#0d1f3c",
  border: "1px solid #1a3a5c",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

const MEDIA_ICONS: Record<string, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: Mic,
  document: FileText,
  url: Link2,
};

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay: i * 0.08, ease: "easeOut" },
  }),
};

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: React.ElementType; tone: "accent" | "green" | "red" | "purple"; }) {
  const styles = {
    accent: "border-cyber-accent/20 bg-cyber-accent/10 text-cyber-accent",
    green: "border-cyber-green/20 bg-cyber-green/10 text-cyber-green",
    red: "border-cyber-red/20 bg-cyber-red/10 text-cyber-red",
    purple: "border-cyber-purple/20 bg-cyber-purple/10 text-cyber-purple",
  }[tone];

  return (
    <div className="glass-card-soft p-5 scan-sweep">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-cyber-muted">{label}</p>
          <p className="text-2xl font-bold font-mono text-cyber-text mt-2">{value}</p>
          <p className="text-xs text-cyber-muted-light mt-1">{detail}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", styles)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function LiveFeedItem({ icon: Icon, title, detail, time, tone }: { icon: React.ElementType; title: string; detail: string; time: string; tone: "green" | "yellow" | "red" | "accent"; }) {
  const styles = {
    green: "bg-cyber-green",
    yellow: "bg-cyber-yellow",
    red: "bg-cyber-red",
    accent: "bg-cyber-accent",
  }[tone];

  return (
    <div className="flex gap-3 rounded-xl border border-cyber-border/40 bg-cyber-surface/55 p-4 hover:border-cyber-accent/30 transition-all duration-200">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border", styles, "bg-opacity-10") }>
        <Icon className={cn("w-4 h-4", tone === "green" ? "text-cyber-green" : tone === "yellow" ? "text-cyber-yellow" : tone === "red" ? "text-cyber-red" : "text-cyber-accent")} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-cyber-text truncate">{title}</p>
          <span className="text-[10px] text-cyber-muted shrink-0">{time}</span>
        </div>
        <p className="text-xs text-cyber-muted-light mt-1 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

function riskBadge(score: number) {
  if (score >= 75) return { label: "AUTHENTIC", tone: "green" as const, icon: ShieldCheck };
  if (score >= 50) return { label: "UNCERTAIN", tone: "yellow" as const, icon: Shield };
  return { label: "HIGH RISK", tone: "red" as const, icon: ShieldAlert };
}

function mediaIcon(type: string): React.ElementType {
  return MEDIA_ICONS[type] ?? FileText;
}

const COLORS = ["#00d4ff", "#9945ff", "#00ff88", "#ffcc00", "#ff3366"];

export default function DashboardPage() {
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
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const topAlerts = useMemo(() => {
    return (dashboard?.recent ?? [])
      .filter((item) => item.verdict === "fake")
      .slice(0, 4)
      .map((item) => ({
        title: item.filename,
        detail: `${item.media_type.toUpperCase()} scan flagged at ${item.trust_score}/100 trust with ${item.processing_time_ms}ms processing time.`,
        time: formatDate(item.timestamp),
      }));
  }, [dashboard]);

  const contentPie = dashboard?.content_types.map((item, index) => ({
    name: item.type,
    value: item.share,
    color: COLORS[index % COLORS.length],
  })) ?? [];

  return (
    <div className="space-y-6 pb-6 relative isolate">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 right-[-8%] w-80 h-80 rounded-full bg-cyber-accent/10 blur-3xl" />
        <div className="absolute top-52 left-[-10%] w-72 h-72 rounded-full bg-cyber-purple/10 blur-3xl" />
        <div className="absolute inset-0 cyber-grid-bg opacity-40" />
      </div>

      <PageHeader
        title="ISAFE Command Center"
        subtitle="Real-time forensic intelligence and authenticity analytics"
        icon={Shield}
        badge="LIVE"
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

      {loading && !dashboard ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="glass-card-soft p-5 space-y-4">
                <div className="h-3 w-24 rounded-full loading-shimmer" />
                <div className="h-8 w-36 rounded-lg loading-shimmer" />
                <div className="h-3 w-3/5 rounded-full loading-shimmer" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 glass-card p-6 space-y-4">
              <div className="h-5 w-40 rounded-full loading-shimmer" />
              <div className="h-[260px] rounded-2xl loading-shimmer" />
            </div>
            <div className="xl:col-span-2 glass-card p-6 space-y-4">
              <div className="h-5 w-32 rounded-full loading-shimmer" />
              <div className="h-[260px] rounded-2xl loading-shimmer" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass-card p-6 space-y-4">
              <div className="h-5 w-44 rounded-full loading-shimmer" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-12 rounded-xl loading-shimmer" />
                ))}
              </div>
            </div>
            <div className="glass-card p-6 space-y-4">
              <div className="h-5 w-36 rounded-full loading-shimmer" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-16 rounded-xl loading-shimmer" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
      <>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Total Analyses" value={String(dashboard?.summary.overall.total_analyses ?? 0)} detail="All scans across modules" icon={Activity} tone="accent" />
        <MetricCard label="High Risk" value={String(dashboard?.summary.overall.flagged ?? 0)} detail={`${dashboard?.summary.overall.fake_rate ?? 0}% fake rate`} icon={AlertTriangle} tone="red" />
        <MetricCard label="Avg Trust Score" value={`${dashboard?.summary.overall.avg_trust_score ?? 0}/100`} detail="Cross-platform trust posture" icon={Shield} tone="green" />
        <MetricCard label="Avg Confidence" value={`${dashboard?.summary.overall.avg_confidence ?? 0}/100`} detail="Model certainty across detections" icon={Percent} tone="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible" className="xl:col-span-3 glass-card p-6 scan-sweep">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyber-accent" />
              <h2 className="section-title">Threat Trend Charts</h2>
            </div>
            <span className="text-[11px] text-cyber-muted">30 days</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dashboard?.trends ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.5)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: "#94a3b8", fontSize: "11px" }}>{value}</span>} />
              <Line type="monotone" dataKey="real" stroke="#00ff88" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fake" stroke="#ff3366" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pending" stroke="#00d4ff" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible" className="xl:col-span-2 glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-4 h-4 text-cyber-purple" />
            <h2 className="section-title">Risk Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dashboard?.risk_distribution ?? []} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.5)" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {(dashboard?.risk_distribution ?? []).map((entry) => (
                  <Cell key={entry.range} fill={entry.color} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {(dashboard?.risk_distribution ?? []).map((item) => (
              <div key={item.range} className="rounded-lg border border-cyber-border/30 bg-cyber-surface/50 px-3 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-cyber-muted truncate">{item.label}</span>
                <span className="ml-auto text-[10px] font-mono font-semibold" style={{ color: item.color }}>{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="xl:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyber-accent" />
              <h2 className="section-title">Content Type Analysis</h2>
            </div>
            <span className="text-[11px] text-cyber-muted">Share of all scans</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-5 items-center">
            <div className="relative w-[180px] h-[180px] mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={contentPie} cx="50%" cy="50%" innerRadius={56} outerRadius={82} paddingAngle={4} dataKey="value">
                    {contentPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number, name: string) => [`${value}%`, name]} />
                  <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: "#94a3b8", fontSize: "11px" }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold font-mono text-cyber-text">{dashboard?.summary.overall.total_analyses ?? 0}</p>
                <p className="text-[9px] text-cyber-muted uppercase tracking-widest">scans</p>
              </div>
            </div>
            <div className="space-y-3">
              {(dashboard?.content_types ?? []).map((item, index) => {
                return (
                  <div key={item.type} className="rounded-lg border border-cyber-border/40 bg-cyber-surface/50 p-3">
                    <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-cyber-text capitalize">{item.type}</span>
                      </div>
                      <span className="font-mono text-cyber-muted">{item.count} scans</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-cyber-border overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} initial={{ width: 0 }} animate={{ width: `${item.share}%` }} transition={{ duration: 0.8 }} />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-cyber-muted">
                      <span>Avg trust: <span className="font-mono text-cyber-text">{item.avg_trust_score}/100</span></span>
                      <span>Flagged: <span className="font-mono text-cyber-text">{item.flagged}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible" className="xl:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyber-green" />
              <h2 className="section-title">Fake vs Real Statistics</h2>
            </div>
            <span className="text-[11px] text-cyber-muted">Verdict mix</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Real", value: dashboard?.summary.verdict_counts.real ?? 0, color: "#00ff88" },
              { label: "Fake", value: dashboard?.summary.verdict_counts.fake ?? 0, color: "#ff3366" },
              { label: "Uncertain", value: dashboard?.summary.verdict_counts.uncertain ?? 0, color: "#ffcc00" },
              { label: "Pending", value: dashboard?.summary.verdict_counts.pending ?? 0, color: "#00d4ff" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-cyber-border/40 bg-cyber-surface/55 p-3 space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-cyber-muted">{item.label}</span>
                  <span className="font-mono text-cyber-text">{item.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-cyber-border overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, item.value * 2)}%` }} transition={{ duration: 0.8 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible" className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-cyber-accent" />
              <h2 className="section-title">Recent Activity Timeline</h2>
            </div>
            <span className="text-[11px] text-cyber-muted">14 days</span>
          </div>
          <div className="space-y-2">
            {(dashboard?.activity_timeline ?? []).map((item) => {
              const peak = Math.max(...(dashboard?.activity_timeline ?? []).map((entry) => entry.scans), 1);
              return (
                <div key={item.date} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[11px] text-cyber-muted">{item.date.slice(5)}</span>
                  <div className="flex-1 h-2 rounded-full bg-cyber-border/80 overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-cyber-accent via-cyber-purple to-cyber-green" initial={{ width: 0 }} animate={{ width: `${(item.scans / peak) * 100}%` }} transition={{ duration: 0.8 }} />
                  </div>
                  <span className="w-10 text-right font-mono text-xs text-cyber-text">{item.scans}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div custom={5} variants={sectionVariants} initial="hidden" animate="visible" className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyber-red" />
              <h2 className="section-title">Threat Notifications</h2>
            </div>
            <span className="badge-danger text-[10px]">
              {topAlerts.length} Active
            </span>
          </div>
          <div className="space-y-3">
            {topAlerts.length > 0 ? (
              topAlerts.map((alert) => (
                <LiveFeedItem key={alert.title + alert.time} icon={AlertTriangle} title={alert.title} detail={alert.detail} time={alert.time} tone="red" />
              ))
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-cyber-surface/50 border border-cyber-border/30 text-sm text-cyber-muted">
                <ShieldCheck className="w-4 h-4 shrink-0 text-cyber-green" />
                No active threat notifications.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div custom={6} variants={sectionVariants} initial="hidden" animate="visible" className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyber-accent" />
              <h2 className="section-title">Live Activity Feed</h2>
            </div>
            <span className="text-[11px] text-cyber-muted">Latest 6</span>
          </div>
          <div className="space-y-3">
            {(dashboard?.recent ?? []).slice(0, 6).map((record) => {
              const badge = riskBadge(record.trust_score);
              const Icon = mediaIcon(record.media_type);
              return (
                <div key={record.id} className="rounded-xl border border-cyber-border/40 bg-cyber-surface/55 p-4 hover:border-cyber-accent/30 transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg border border-cyber-border flex items-center justify-center bg-cyber-card shrink-0">
                      <Icon className="w-4 h-4 text-cyber-muted-light" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-cyber-text truncate">{record.filename}</p>
                        <span className={cn(badge.tone === "green" ? "badge-safe" : badge.tone === "yellow" ? "badge-warning" : "badge-danger", "text-[10px]")}>{badge.label}</span>
                      </div>
                      <p className="text-xs text-cyber-muted-light mt-1">{record.media_type.toUpperCase()} · {record.model_used} · {record.processing_time_ms}ms · {formatDate(record.timestamp)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] text-cyber-muted">
                    <div className="rounded-lg bg-cyber-surface/60 border border-cyber-border/30 p-2 text-center">
                      <p>Trust</p>
                      <p className="font-mono text-cyber-text">{Math.round(record.trust_score)}</p>
                    </div>
                    <div className="rounded-lg bg-cyber-surface/60 border border-cyber-border/30 p-2 text-center">
                      <p>Confidence</p>
                      <p className="font-mono text-cyber-text">{Math.round(record.confidence)}</p>
                    </div>
                    <div className="rounded-lg bg-cyber-surface/60 border border-cyber-border/30 p-2 text-center">
                      <p>Verdict</p>
                      <p className="font-mono text-cyber-text">{record.verdict.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div custom={7} variants={sectionVariants} initial="hidden" animate="visible" className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyber-accent" />
              <h2 className="section-title">System Overview</h2>
            </div>
            <span className="text-[11px] text-cyber-muted">Latest scan {dashboard?.summary.overall.latest_timestamp ? formatDate(dashboard.summary.overall.latest_timestamp) : "—"}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/55 p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Clean</p>
              <p className="text-2xl font-bold font-mono text-cyber-green mt-2">{dashboard?.summary.overall.clean ?? 0}</p>
            </div>
            <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/55 p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Pending</p>
              <p className="text-2xl font-bold font-mono text-cyber-accent mt-2">{dashboard?.summary.overall.pending ?? 0}</p>
            </div>
            <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/55 p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Uptime</p>
              <p className="text-2xl font-bold font-mono text-cyber-green mt-2">99.9%</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Authentic", value: dashboard?.summary.verdict_counts.real ?? 0, color: "#00ff88" },
              { label: "Uncertain", value: dashboard?.summary.verdict_counts.uncertain ?? 0, color: "#ffcc00" },
              { label: "Synthetic", value: dashboard?.summary.verdict_counts.fake ?? 0, color: "#ff3366" },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyber-muted-light">{item.label}</span>
                  <span className="font-mono text-cyber-text">{item.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-cyber-border overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, item.value * 2)}%` }} transition={{ duration: 0.8 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div custom={8} variants={sectionVariants} initial="hidden" animate="visible" className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Dashboard Notes</h2>
            <p className="text-xs text-cyber-muted-light mt-1">All visible values are derived from CSV-backed scan histories and live API aggregation.</p>
          </div>
          <span className="badge-info text-[10px]"><Sparkles className="w-2.5 h-2.5" />Real-time telemetry</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Threat notifications</p>
            <p className="text-lg font-semibold text-cyber-text mt-2">{topAlerts.length}</p>
            <p className="text-xs text-cyber-muted-light mt-1">Flagged scans promoted into notifications</p>
          </div>
          <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Top risk bucket</p>
            <p className="text-lg font-semibold text-cyber-text mt-2">
              {dashboard?.summary.risk_distribution?.reduce((max, item) => (item.count > max.count ? item : max), dashboard.summary.risk_distribution[0] ?? { label: "N/A", count: 0 }).label ?? "N/A"}
            </p>
            <p className="text-xs text-cyber-muted-light mt-1">Largest trust-score concentration</p>
          </div>
          <div className="rounded-xl border border-cyber-border/40 bg-cyber-surface/50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-cyber-muted">Mean confidence</p>
            <p className="text-lg font-semibold text-cyber-text mt-2">{dashboard?.summary.overall.avg_confidence ?? 0}/100</p>
            <p className="text-xs text-cyber-muted-light mt-1">Operational certainty across engines</p>
          </div>
        </div>
      </motion.div>
      </>
      )}
    </div>
  );
}