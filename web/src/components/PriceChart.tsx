"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

const RANGES = [
  { label: "7D", days: 7 }, { label: "30D", days: 30 },
  { label: "90D", days: 90 }, { label: "1Y", days: 365 }, { label: "ALL", days: 9999 },
];

export default function PriceChart({ history }: { history: any[] }) {
  const [range, setRange] = useState(30);

  const filtered = history.filter(
    (h) => range === 9999 || new Date(h.recorded_at) > new Date(Date.now() - range * 86400000)
  );

  const data = filtered.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString(),
    price: parseFloat(h.price),
  }));

  const prices = data.map((d) => d.price);
  const high = prices.length ? Math.max(...prices) : 0;
  const low = prices.length ? Math.min(...prices) : 0;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="p-4 rounded-sm">
      <div className="flex justify-between mb-4">
        <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
          52W HIGH: <span style={{ color: "var(--up)" }}>${high.toFixed(2)}</span>
          &nbsp;&nbsp;LOW: <span style={{ color: "var(--down)" }}>${low.toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setRange(r.days)}
              className="text-xs px-2 py-1 rounded-sm font-mono"
              style={{
                background: range === r.days ? "var(--accent)" : "var(--bg)",
                color: range === r.days ? "#000" : "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
          <Line type="monotone" dataKey="price" stroke="var(--accent)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
