'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

// Chart colors — keep hex for Recharts props (Pokédex theme)
const CHART_COLORS = { accent: '#30A7D7', textMuted: '#6B7280', border: '#E0E0DC' };

type DataPoint = { time: string; value: number };

type Props = {
  data: DataPoint[];
  currentValue: number;
  changePct: number;
};

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

export default function IndexChart({ data, currentValue, changePct }: Props) {
  const [range, setRange] = useState(30);

  const filtered = useMemo(() => {
    const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
    return data.filter((d) => new Date(d.time).getTime() >= cutoff);
  }, [data, range]);

  const isUp = changePct >= 0;
  const hasData = currentValue > 0;

  return (
    <div className="bg-surface rounded-xl px-6 py-7 sm:px-10 sm:py-9 border border-border">
      {/* Header row */}
      <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-text-muted mb-2">
            PokéMarket Index
          </p>
          <div className="flex items-baseline gap-4">
            <span
              className={`num text-5xl sm:text-6xl md:text-7xl lg:text-[96px] font-bold tracking-tighter leading-none ${
                hasData ? 'text-text' : 'text-text-muted'
              }`}
            >
              {hasData
                ? currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '—'}
            </span>
            {hasData && changePct !== 0 && (
              <span className={`num text-xl font-bold ${isUp ? 'text-up' : 'text-down'}`}>
                {isUp ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        {/* Range toggle */}
        <div className="flex gap-1 bg-bg rounded-lg p-1 self-start border border-border">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.days)}
              className={`px-4 py-1.5 rounded-md border-none cursor-pointer text-[13px] font-semibold transition-all duration-150 ${
                range === r.days
                  ? 'bg-surface-dark text-text-inverse'
                  : 'bg-transparent text-text-muted'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {filtered.length > 1 ? (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={filtered} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="pmiGradient" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(v) => v.toFixed(0)}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: '#0D0D0D',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                color: '#fff',
              }}
              labelStyle={{ color: CHART_COLORS.textMuted, marginBottom: 4 }}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
              formatter={(value: number | undefined) => [
                value != null ? value.toFixed(2) : '—',
                'PMI',
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS.accent}
              strokeWidth={2}
              fill="url(#pmiGradient)"
              dot={false}
              activeDot={{ r: 5, fill: CHART_COLORS.accent, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-60 flex flex-col items-center justify-center text-text-muted gap-2">
          <p className="text-sm font-medium">No chart data yet</p>
          <p className="text-xs">Run <code>/api/prices</code> then <code>/api/index</code> to seed data</p>
        </div>
      )}
    </div>
  );
}
