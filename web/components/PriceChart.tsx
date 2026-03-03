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

// Chart color — matches --accent in globals.css
const CHART_COLOR = '#7C3AED';

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
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: '20px 24px 16px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Range toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: 'var(--surface-2)',
            borderRadius: 12,
            padding: 4,
          }}
        >
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.days)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                background: range === r.days ? 'var(--gradient)' : 'transparent',
                color: range === r.days ? '#fff' : 'var(--text-muted)',
                boxShadow: range === r.days ? '0 1px 3px rgba(124,58,237,0.3)' : 'none',
                transition: 'all 0.15s',
              }}
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
                <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'inherit' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'inherit' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 13,
                boxShadow: 'var(--shadow)',
              }}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              }
              formatter={(value: number | undefined) => [`$${(value as number).toFixed(2)}`, 'Avg Price']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={CHART_COLOR}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: CHART_COLOR, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div
          style={{
            height: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          No chart data yet
        </div>
      )}
    </div>
  );
}
