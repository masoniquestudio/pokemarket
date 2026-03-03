'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

// Sparkline colors — match --up / --down in globals.css
const UP_COLOR = '#10B981';
const DOWN_COLOR = '#EF4444';

type IndexData = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  value: number;
  changePct: number;
  history: { time: string; value: number }[];
};

export default function IndexTiles({ indices }: { indices: IndexData[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 12,
      }}
    >
      {indices.map((idx) => (
        <IndexTile key={idx.id} index={idx} />
      ))}
    </div>
  );
}

function IndexTile({ index }: { index: IndexData }) {
  const isUp = index.changePct >= 0;
  const hasData = index.value > 0;
  const sparkColor = isUp ? UP_COLOR : DOWN_COLOR;

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: '18px 20px 14px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                background: 'var(--gradient)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {index.shortName}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{index.name}</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{index.description}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              className="num"
              style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}
            >
              {hasData
                ? index.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '—'}
            </span>
            {hasData && index.changePct !== 0 && (
              <span
                className="num"
                style={{ fontSize: 13, fontWeight: 600, color: isUp ? 'var(--up)' : 'var(--down)' }}
              >
                {isUp ? '▲' : '▼'} {Math.abs(index.changePct).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mini sparkline */}
      {index.history.length > 1 ? (
        <ResponsiveContainer width="100%" height={48}>
          <AreaChart data={index.history} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${index.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sparkColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip contentStyle={{ display: 'none' }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={sparkColor}
              strokeWidth={1.5}
              fill={`url(#grad-${index.id})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Building history...</span>
        </div>
      )}
    </div>
  );
}
