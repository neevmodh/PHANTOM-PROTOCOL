"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { RISK_DISTRIBUTION } from "@/lib/demo-data";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1f3c",
  border: "1px solid #1a3a5c",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { label: string; color: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2 shadow-glass">
      <p className="text-[11px] text-cyber-muted mb-1">Score range: {label}</p>
      <p className="text-sm font-semibold" style={{ color: d.payload.color }}>
        {d.payload.label}
      </p>
      <p className="text-xs text-cyber-text mt-0.5">
        <span className="font-mono font-bold">{d.value}</span> detections
      </p>
    </div>
  );
}

export function RiskDistributionChart() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-cyber-purple" />
          <h2 className="text-sm font-semibold text-cyber-text tracking-wide">
            Risk Score Distribution
          </h2>
        </div>
        <span className="text-[11px] text-cyber-muted">3,284 total</span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={RISK_DISTRIBUTION} barSize={28}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(26,58,92,0.5)"
            vertical={false}
          />
          <XAxis
            dataKey="range"
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,212,255,0.04)" }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {RISK_DISTRIBUTION.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {RISK_DISTRIBUTION.map((item) => (
          <div key={item.range} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-cyber-muted truncate">
              {item.label}
            </span>
            <span
              className="text-[10px] font-mono font-semibold ml-auto"
              style={{ color: item.color }}
            >
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
