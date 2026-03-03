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
        background: '#21386E',
        borderRadius: 16,
        padding: '28px 32px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',
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
              color: '#a0b8d8',
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
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {hasData
                ? currentValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : '—'}
            </span>
            {hasData && changePct !== 0 && (
              <span
                className="num"
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: isUp ? '#00c853' : '#ff3d00',
                }}
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
            background: '#3466AF',
            borderRadius: 10,
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
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                background: range === r.days ? '#1D2C5E' : 'transparent',
                color: range === r.days ? '#ffffff' : 'rgba(255,255,255,0.5)',
                boxShadow:
                  range === r.days ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
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
          <AreaChart
            data={filtered}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="pmiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFCB05" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#FFCB05" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(52,102,175,0.3)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#a0b8d8', fontFamily: 'inherit' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#a0b8d8', fontFamily: 'inherit' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v) => v.toFixed(0)}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: '#21386E',
                border: '1px solid rgba(52,102,175,0.5)',
                borderRadius: 10,
                fontSize: 13,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }
              formatter={(value: number | undefined) => [
                value != null ? value.toFixed(2) : '—',
                'PMI',
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#FFCB05"
              strokeWidth={2.5}
              fill="url(#pmiGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#FFCB05',
                stroke: '#1D2C5E',
                strokeWidth: 2,
              }}
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
            color: 'rgba(255,255,255,0.3)',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 32 }}>📈</span>
          <p style={{ fontSize: 14, fontWeight: 500 }}>No chart data yet</p>
          <p style={{ fontSize: 12 }}>
            Run <code>/api/prices</code> then <code>/api/index</code> to seed
            data
          </p>
        </div>
      )}
    </div>
  );
}
