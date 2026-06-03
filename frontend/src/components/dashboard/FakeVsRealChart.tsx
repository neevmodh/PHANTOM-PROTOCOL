"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { TREND_30D } from "@/lib/demo-data";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1f3c",
  border: "1px solid #1a3a5c",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2.5 shadow-glass min-w-[130px]">
      <p className="text-[11px] text-cyber-muted mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[11px] text-cyber-muted-light capitalize">{p.name}</span>
          </div>
          <span className="text-xs font-mono font-semibold" style={{ color: p.color }}>
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function FakeVsRealChart() {
  const totalFake = TREND_30D.reduce((s, d) => s + d.fake, 0);
  const totalReal = TREND_30D.reduce((s, d) => s + d.real, 0);
  const fakeRatio = Math.round((totalFake / (totalFake + totalReal)) * 100);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyber-accent" />
          <h2 className="text-sm font-semibold text-cyber-text tracking-wide">
            Fake vs Real — 30 Day Trend
          </h2>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-red/10 border border-cyber-red/20">
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-red" />
          <span className="text-[11px] text-cyber-red font-semibold">
            {totalFake} synthetic ({fakeRatio}%)
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-green/10 border border-cyber-green/20">
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-green" />
          <span className="text-[11px] text-cyber-green font-semibold">
            {totalReal} authentic ({100 - fakeRatio}%)
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={TREND_30D} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="fakeAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff3366" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#ff3366" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="realAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00ff88" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="pendingAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(26,58,92,0.5)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={3}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={7}
            formatter={(v) => (
              <span style={{ color: "#94a3b8", fontSize: "11px" }}>{v}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="real"
            stroke="#00ff88"
            strokeWidth={2}
            fill="url(#realAreaGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#00ff88" }}
          />
          <Area
            type="monotone"
            dataKey="fake"
            stroke="#ff3366"
            strokeWidth={2}
            fill="url(#fakeAreaGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#ff3366" }}
          />
          <Area
            type="monotone"
            dataKey="pending"
            stroke="#00d4ff"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            fill="url(#pendingAreaGrad)"
            dot={false}
            activeDot={{ r: 3, fill: "#00d4ff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
