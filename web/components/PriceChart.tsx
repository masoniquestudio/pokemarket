'use client';

import { useState, useMemo, useId } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

// Chart colors — keep hex for Recharts props (dark theme)
const CHART_COLORS = { accent: '#A3A3A3', textMuted: '#525252', border: '#262626' };

type DataPoint = {
  time: string;
  value: number;
};

type Props = {
  data: DataPoint[];
};

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'All', days: 0 },
];

export default function PriceChart({ data }: Props) {
  const gradientId = useId();
  const [range, setRange] = useState(30);

  const filtered = useMemo(() => {
    if (range === 0) return data;
    const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
    return data.filter((d) => new Date(d.time).getTime() >= cutoff);
  }, [data, range]);

  return (
    <div className="bg-surface rounded-xl px-6 py-5 border border-border">
      {/* Range toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex gap-0.5">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.days)}
              className={`px-3 py-1 rounded border-none cursor-pointer text-[11px] tracking-wider font-medium transition-all duration-150 ${
                range === r.days
                  ? 'bg-white/10 text-text'
                  : 'bg-transparent text-text-muted hover:text-text'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 1 ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={filtered} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.1} />
                <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: CHART_COLORS.textMuted, fontFamily: 'inherit' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: CHART_COLORS.textMuted, fontFamily: 'inherit' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: '#1A1A1A',
                border: '1px solid #262626',
                borderRadius: 8,
                fontSize: 13,
                color: '#FAFAFA',
              }}
              labelStyle={{ color: CHART_COLORS.textMuted, marginBottom: 4 }}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              }
              formatter={(value: number | undefined) => [`$${(value as number).toFixed(2)}`, 'Avg Price']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS.accent}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: CHART_COLORS.accent, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[220px] flex items-center justify-center text-text-muted text-sm">
          No chart data yet
        </div>
      )}
    </div>
  );
}
