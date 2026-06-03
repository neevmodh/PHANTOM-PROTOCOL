"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ChartVariant = "line" | "bar" | "pie" | "area";

interface AnalyticsChartProps {
  variant?: ChartVariant;
  data?: any[];
  pieData?: Array<{ name: string; value: number; color: string }>;
  height?: number;
}

// Placeholder data for layout preview
const TREND_DATA = [
  { date: "May 13", fake: 4, real: 12, pending: 2 },
  { date: "May 14", fake: 7, real: 18, pending: 3 },
  { date: "May 15", fake: 3, real: 9, pending: 1 },
  { date: "May 16", fake: 9, real: 22, pending: 4 },
  { date: "May 17", fake: 5, real: 15, pending: 2 },
  { date: "May 18", fake: 11, real: 28, pending: 5 },
  { date: "May 19", fake: 6, real: 19, pending: 3 },
];

const PIE_DATA = [
  { name: "Image", value: 38, color: "#00d4ff" },
  { name: "Video", value: 24, color: "#9945ff" },
  { name: "Audio", value: 18, color: "#00ff88" },
  { name: "Document", value: 12, color: "#ffcc00" },
  { name: "URL", value: 8, color: "#ff3366" },
];

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1f3c",
  border: "1px solid #1a3a5c",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

export function AnalyticsChart({ variant = "line", data, pieData, height = 220 }: AnalyticsChartProps) {
  const chartData = data ?? TREND_DATA;
  const resolvedPieData = pieData ?? PIE_DATA;

  if (variant === "pie") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={resolvedPieData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {resolvedPieData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} opacity={0.85} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number, name: string) => [`${value}%`, name]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: "#94a3b8", fontSize: "11px" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (variant === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} barSize={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.5)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(0,212,255,0.05)" }} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span style={{ color: "#94a3b8", fontSize: "11px" }}>{v}</span>}
          />
          <Bar dataKey="fake" fill="#ff3366" radius={[4, 4, 0, 0]} />
          <Bar dataKey="real" fill="#00ff88" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending" fill="#00d4ff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (variant === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="fakeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ff3366" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.5)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Area type="monotone" dataKey="fake" stroke="#ff3366" fill="url(#fakeGrad)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="real" stroke="#00ff88" fill="url(#realGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Default: line
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,58,92,0.5)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span style={{ color: "#94a3b8", fontSize: "11px" }}>{v}</span>}
        />
        <Line type="monotone" dataKey="fake" stroke="#ff3366" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="real" stroke="#00ff88" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="pending" stroke="#00d4ff" strokeWidth={2} dot={false} strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  );
}
