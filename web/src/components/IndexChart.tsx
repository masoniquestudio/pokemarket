"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

export default function IndexChart({ history, name }: { history: any[]; name: string }) {
  const [range, setRange] = useState(30);

  const filtered = history.filter(
    (h) => new Date(h.recorded_at) > new Date(Date.now() - range * 86400000)
  );

  const data = filtered.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString(),
    value: parseFloat(h.value),
  }));

  const isUp = data.length >= 2 && data[data.length - 1].value >= data[0].value;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="p-4 rounded-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{name}</span>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className="text-xs px-2 py-1 rounded-sm font-mono"
              style={{
                background: range === r.days ? "var(--accent)" : "var(--bg)",
                color: range === r.days ? "#000" : "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isUp ? "var(--up)" : "var(--down)"} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isUp ? "var(--up)" : "var(--down)"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isUp ? "var(--up)" : "var(--down)"}
            fill="url(#colorValue)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
