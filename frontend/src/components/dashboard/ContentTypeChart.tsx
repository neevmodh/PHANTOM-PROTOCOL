"use client";

import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Layers } from "lucide-react";
import { CONTENT_TYPE_DIST } from "@/lib/demo-data";

const TOOLTIP_STYLE = {
  backgroundColor: "#0d1f3c",
  border: "1px solid #1a3a5c",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { count: number; color: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2 shadow-glass">
      <p className="text-xs font-semibold" style={{ color: d.payload.color }}>
        {d.name}
      </p>
      <p className="text-[11px] text-cyber-muted-light mt-0.5">
        <span className="font-mono font-bold text-cyber-text">{d.payload.count}</span> scans
        &nbsp;·&nbsp;
        <span className="font-mono font-bold" style={{ color: d.payload.color }}>
          {d.value}%
        </span>
      </p>
    </div>
  );
}

export function ContentTypeChart() {
  const total = CONTENT_TYPE_DIST.reduce((s, d) => s + d.count, 0);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Layers className="w-4 h-4 text-cyber-accent" />
        <h2 className="text-sm font-semibold text-cyber-text tracking-wide">
          Content Type Distribution
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative shrink-0">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie
                data={CONTENT_TYPE_DIST}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={62}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {CONTENT_TYPE_DIST.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.9} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-lg font-bold font-mono text-cyber-text">
              {(total / 1000).toFixed(1)}k
            </p>
            <p className="text-[9px] text-cyber-muted uppercase tracking-widest">total</p>
          </div>
        </div>

        {/* Legend with bars */}
        <div className="flex-1 space-y-2.5">
          {CONTENT_TYPE_DIST.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-cyber-muted-light">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyber-muted">{item.count}</span>
                  <span
                    className="font-mono font-semibold w-8 text-right"
                    style={{ color: item.color }}
                  >
                    {item.value}%
                  </span>
                </div>
              </div>
              <div className="h-1 bg-cyber-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: i * 0.07 + 0.2 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
