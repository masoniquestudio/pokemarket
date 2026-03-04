import Link from 'next/link';

export type CardRow = {
  id: string;
  name: string;
  set: string;
  tier: string;
  currentPrice: number;
  changePct: number | null;
  volume: number | null;
};

type Period = '1d' | '7d' | '30d' | '90d';

type Props = {
  gainers: CardRow[];
  losers: CardRow[];
  period?: Period;
};

const TIER_LABELS: Record<string, string> = {
  vintage: 'Vintage',
  iconic: 'Iconic',
  'modern-chase': 'Modern',
};

const PERIOD_LABELS: Record<Period, string> = {
  '1d': '24h',
  '7d': '7d',
  '30d': '30d',
  '90d': '90d',
};

export default function MoversTable({ gainers, losers, period = '7d' }: Props) {
  const periodLabel = PERIOD_LABELS[period];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Table title="Top Gainers" rows={gainers} type="up" periodLabel={periodLabel} />
      <Table title="Top Losers" rows={losers} type="down" periodLabel={periodLabel} />
    </div>
  );
}

function Table({ title, rows, type, periodLabel }: { title: string; rows: CardRow[]; type: 'up' | 'down'; periodLabel: string }) {
  return (
    <div className="bg-surface rounded-2xl px-6 py-5 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`inline-block w-2 h-2 rounded-full ${type === 'up' ? 'bg-up' : 'bg-down'}`}
        />
        <h3 className="text-[13px] font-semibold tracking-wide uppercase text-text">
          {title}
        </h3>
        <span className="text-[11px] text-text-muted ml-auto">vs {periodLabel}</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-[13px] text-text-muted text-center py-6">No data yet</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Card', 'Price', 'Chg %'].map((h, i) => (
                <th
                  key={h}
                  className={`${i === 0 ? 'text-left' : 'text-right'} text-[11px] font-medium text-text-muted pb-2 border-b border-border`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={i < rows.length - 1 ? 'border-b border-border' : ''}
              >
                <td className="py-2.5">
                  <Link href={`/cards/${row.id}`} className="no-underline">
                    <p className="text-sm font-semibold text-text mb-0.5">{row.name}</p>
                    <p className="text-[11px] text-text-muted">{TIER_LABELS[row.tier] ?? row.tier} · {row.set}</p>
                  </Link>
                </td>
                <td className="text-right py-2.5">
                  <span className="num text-sm font-semibold text-text">
                    ${row.currentPrice.toFixed(2)}
                  </span>
                </td>
                <td className="text-right py-2.5">
                  <span
                    className={`num text-[13px] font-bold ${
                      row.changePct === null
                        ? 'text-text-muted'
                        : row.changePct >= 0
                        ? 'text-up'
                        : 'text-down'
                    }`}
                  >
                    {row.changePct === null ? '—' : `${row.changePct >= 0 ? '+' : ''}${row.changePct.toFixed(2)}%`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
