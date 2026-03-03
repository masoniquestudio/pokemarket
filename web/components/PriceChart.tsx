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

type DataPoint = {
  time: string;
  value: number;
  low?: number;
  high?: number;
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
  const [range, setRange] = useState(30);

  const filtered = useMemo(() => {
    if (range === 0) return data;
    const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
    return data.filter((d) => new Date(d.time).getTime() >= cutoff);
  }, [data, range]);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '20px 24px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      {/* Range toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: '#f5f5f5',
            borderRadius: 10,
            padding: 4,
          }}
        >
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.days)}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                background: range === r.days ? '#fff' : 'transparent',
                color: range === r.days ? '#1a1a1a' : '#909090',
                boxShadow: range === r.days ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
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
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f7d02c" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f7d02c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#aaa', fontFamily: 'inherit' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#aaa', fontFamily: 'inherit' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`}
              width={56}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #ebebeb',
                borderRadius: 10,
                fontSize: 13,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              }
              formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(2)}`, 'Avg Price']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#f7d02c"
              strokeWidth={2.5}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#f7d02c', stroke: '#fff', strokeWidth: 2 }}
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
            color: '#bbb',
            fontSize: 14,
          }}
        >
          No chart data yet
        </div>
      )}
    </div>
  );
}
