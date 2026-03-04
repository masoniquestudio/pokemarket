'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

// Sparkline colors — keep hex for Recharts props (dark theme)
const CHART_COLORS = { up: '#4ADE80', down: '#F87171' };

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {indices.map((idx) => (
        <IndexTile key={idx.id} index={idx} />
      ))}
    </div>
  );
}

function IndexTile({ index }: { index: IndexData }) {
  const isUp = index.changePct >= 0;
  const hasData = index.value > 0;
  const sparkColor = isUp ? CHART_COLORS.up : CHART_COLORS.down;

  return (
    <div className="bg-surface rounded-xl px-5 pt-5 pb-4 border border-border">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-widest bg-white/10 text-text px-2 py-1 rounded-md">
              {index.shortName}
            </span>
            <span className="text-xs text-text-muted font-medium">{index.name}</span>
          </div>
          <p className="text-[11px] text-text-muted mb-2">{index.description}</p>
          <div className="flex items-baseline gap-2">
            <span className="num text-[28px] font-bold text-text tracking-tight">
              {hasData
                ? index.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '—'}
            </span>
            {hasData && (
              <span className={`num text-[13px] font-bold ${
                index.changePct === 0 ? 'text-amber-400' : isUp ? 'text-up' : 'text-down'
              }`}>
                {index.changePct === 0 ? '—' : isUp ? '▲' : '▼'} {Math.abs(index.changePct).toFixed(2)}%
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
                <stop offset="5%" stopColor={sparkColor} stopOpacity={0.15} />
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
        <div className="h-12 flex items-center">
          <span className="text-[11px] text-text-muted">Building history...</span>
        </div>
      )}
    </div>
  );
}
