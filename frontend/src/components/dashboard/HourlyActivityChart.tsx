"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Activity } from "lucide-react";
import { HOURLY_ACTIVITY } from "@/lib/demo-data";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1f3c",
  border: "1px solid #1a3a5c",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

const currentHour = new Date().getHours();

export function HourlyActivityChart() {
  const peak = Math.max(...HOURLY_ACTIVITY.map((d) => d.scans));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyber-accent" />
          <h2 className="text-sm font-semibold text-cyber-text tracking-wide">
            Hourly Scan Activity
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-cyber-muted">
          <span>Peak: <span className="text-cyber-accent font-mono font-semibold">{peak}</span></span>
          <span>·</span>
          <span>Now: <span className="text-cyber-green font-mono font-semibold">
            {HOURLY_ACTIVITY[currentHour]?.scans ?? 0}
          </span></span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={HOURLY_ACTIVITY} barSize={7} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
          <XAxis
            dataKey="hour"
            tick={{ fill: "#64748b", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval={3}
            tickFormatter={(v) => `${v}h`}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number) => [`${v} scans`, "Activity"]}
            labelFormatter={(l) => `${l}:00`}
            cursor={{ fill: "rgba(0,212,255,0.05)" }}
          />
          <Bar dataKey="scans" radius={[3, 3, 0, 0]}>
            {HOURLY_ACTIVITY.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  i === currentHour
                    ? "#00ff88"
                    : entry.scans > 80
                    ? "#9945ff"
                    : entry.scans > 50
                    ? "#00d4ff"
                    : "rgba(0,212,255,0.4)"
                }
                fillOpacity={i === currentHour ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyber-green" />
          <span className="text-[10px] text-cyber-muted">Current hour</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyber-purple" />
          <span className="text-[10px] text-cyber-muted">High activity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyber-accent" />
          <span className="text-[10px] text-cyber-muted">Normal</span>
        </div>
      </div>
    </div>
  );
}
