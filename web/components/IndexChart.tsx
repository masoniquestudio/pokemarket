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

// Chart stroke color — matches --accent in globals.css
const CHART_COLOR = '#7C3AED';

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
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: '28px 32px 20px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 6,
            }}
          >
            PokéMarket Index
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span
              className="num"
              style={{
                fontSize: 42,
                fontWeight: 800,
                background: hasData ? 'var(--gradient)' : 'none',
                WebkitBackgroundClip: hasData ? 'text' : 'unset',
                WebkitTextFillColor: hasData ? 'transparent' : 'var(--text)',
                color: hasData ? undefined : 'var(--text)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {hasData
                ? currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '—'}
            </span>
            {hasData && changePct !== 0 && (
              <span
                className="num"
                style={{ fontSize: 16, fontWeight: 600, color: isUp ? 'var(--up)' : 'var(--down)' }}
              >
                {isUp ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        {/* Range toggle */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: 'var(--surface-2)',
            borderRadius: 12,
            padding: 4,
            alignSelf: 'flex-start',
          }}
        >
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.days)}
              style={{
                padding: '6px 16px',
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

      {/* Chart */}
      {filtered.length > 1 ? (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={filtered} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="pmiGradient" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(v) => v.toFixed(0)}
              width={48}
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
              stroke={CHART_COLOR}
              strokeWidth={2.5}
              fill="url(#pmiGradient)"
              dot={false}
              activeDot={{ r: 5, fill: CHART_COLOR, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div
          style={{
            height: 240,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 32 }}>📈</span>
          <p style={{ fontSize: 14, fontWeight: 500 }}>No chart data yet</p>
          <p style={{ fontSize: 12 }}>Run <code>/api/prices</code> then <code>/api/index</code> to seed data</p>
        </div>
      )}
    </div>
  );
}
