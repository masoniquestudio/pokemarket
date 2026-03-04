import { notFound } from 'next/navigation';
import { getCard, CARDS } from '../../../lib/cards';
import { getPriceHistory } from '../../../lib/db';
import Nav from '../../../components/Nav';
import PriceChart from '../../../components/PriceChart';

export const revalidate = 21600;

const TIER_LABELS: Record<string, string> = {
  vintage: 'Vintage',
  iconic: 'Iconic',
  'modern-chase': 'Modern Chase',
};

const TIER_CLASSES: Record<string, string> = {
  vintage: 'bg-tier-vintage-bg text-tier-vintage',
  iconic: 'bg-tier-iconic-bg text-tier-iconic',
  'modern-chase': 'bg-tier-modern-bg text-tier-modern',
};

type Props = { params: Promise<{ id: string }> };

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;
  const card = getCard(id);
  if (!card) return notFound();

  type PriceRow = { price_avg: string; price_low: string | null; price_high: string | null; volume: number | null; recorded_at: Date };
  // Fetch 90 days of snapshots
  let history: PriceRow[] = [];
  try {
    history = (await getPriceHistory(id, 90)) as PriceRow[];
  } catch {
    // DB not ready yet
  }

  // Chart data — oldest first
  const chartData = history.map((r) => ({
    time: new Date(r.recorded_at).toISOString(),
    value: parseFloat(String(r.price_avg)),
  }));

  // Stats: current price, 7d change, 30d change
  const latest = history.length > 0 ? parseFloat(String(history[history.length - 1].price_avg)) : null;

  function priceAtDaysAgo(days: number): number | null {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const old = [...history].reverse().find((r) => new Date(r.recorded_at).getTime() <= cutoff);
    return old ? parseFloat(String(old.price_avg)) : null;
  }

  function changePct(current: number | null, prev: number | null): number | null {
    if (!current || !prev || prev === 0) return null;
    return ((current - prev) / prev) * 100;
  }

  const price7dAgo = priceAtDaysAgo(7);
  const price30dAgo = priceAtDaysAgo(30);
  const change7d = changePct(latest, price7dAgo);
  const change30d = changePct(latest, price30dAgo);

  // Related cards: same tier, exclude current, pick up to 4
  const related = CARDS.filter((c) => c.tier === card.tier && c.id !== card.id).slice(0, 4);

  // TCGPlayer search URL
  const tcgplayerUrl = `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(card.name)}`;

  // Snapshot table — most recent first, cap at 30
  const tableRows = [...history].reverse().slice(0, 30);

  const tierClass = TIER_CLASSES[card.tier] ?? 'bg-violet-500/10 text-accent';

  return (
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="max-w-5xl mx-auto px-6 pt-8 pb-16 flex flex-col gap-5">
        {/* Breadcrumb */}
        <a
          href="/"
          className="text-[13px] text-text-muted no-underline inline-flex items-center gap-1"
        >
          ← All Cards
        </a>

        {/* Card header */}
        <div className="bg-surface rounded-2xl px-6 py-6 sm:px-7 border border-border">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text mb-1.5">
                {card.name}
              </h1>
              <p className="text-sm text-text-muted">
                {card.set} · #{card.number} · {card.era}
              </p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full self-start ${tierClass}`}>
              {TIER_LABELS[card.tier] ?? card.tier}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex gap-8 mt-6 flex-wrap">
            <div>
              <p className="text-[11px] text-text-muted font-semibold tracking-wide uppercase mb-1">
                Current Avg
              </p>
              <span className="num text-[32px] font-bold text-text tracking-tight">
                {latest != null ? `$${latest.toFixed(2)}` : '—'}
              </span>
            </div>
            {[{ label: '7d Change', val: change7d }, { label: '30d Change', val: change30d }].map(({ label, val }) => (
              <div key={label}>
                <p className="text-[11px] text-text-muted font-semibold tracking-wide uppercase mb-1">
                  {label}
                </p>
                <span
                  className={`num text-[22px] font-bold ${
                    val === null ? 'text-text-muted' : val >= 0 ? 'text-up' : 'text-down'
                  }`}
                >
                  {val === null ? '—' : `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Price chart */}
        <PriceChart data={chartData} />

        {/* Snapshot history table */}
        <div className="bg-surface rounded-2xl px-6 py-5 border border-border">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-[13px] font-semibold tracking-wide uppercase text-text">
              Price History
            </h3>
            <a
              href={tcgplayerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-semibold text-accent no-underline px-3.5 py-1.5 rounded-full border-[1.5px] border-border"
            >
              View on TCGPlayer →
            </a>
          </div>

          {tableRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[400px]">
                <thead>
                  <tr>
                    {['Date', 'Avg Price', 'Low', 'High', 'Volume'].map((h, i) => (
                      <th
                        key={h}
                        className={`${i === 0 ? 'text-left' : 'text-right'} text-[11px] font-medium text-text-muted pb-2.5 border-b border-border ${
                          i < 4 ? 'pr-4' : ''
                        } ${i >= 2 && i <= 4 ? 'hidden sm:table-cell' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => {
                    const avg = parseFloat(String(row.price_avg));
                    const low = row.price_low ? parseFloat(String(row.price_low)) : null;
                    const high = row.price_high ? parseFloat(String(row.price_high)) : null;
                    return (
                      <tr key={new Date(row.recorded_at).toISOString()} className={i < tableRows.length - 1 ? 'border-b border-border' : ''}>
                        <td className="py-2.5 pr-4 text-[13px] text-text-muted">
                          {new Date(row.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="num text-right py-2.5 pr-4 text-sm font-semibold text-text">
                          ${avg.toFixed(2)}
                        </td>
                        <td className="num text-right py-2.5 pr-4 text-[13px] text-text-muted hidden sm:table-cell">
                          {low != null ? `$${low.toFixed(2)}` : '—'}
                        </td>
                        <td className="num text-right py-2.5 pr-4 text-[13px] text-text-muted hidden sm:table-cell">
                          {high != null ? `$${high.toFixed(2)}` : '—'}
                        </td>
                        <td className="num text-right py-2.5 text-[13px] text-text-muted hidden sm:table-cell">
                          {row.volume ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-8">
              No price data yet — run /api/prices to seed data
            </p>
          )}
        </div>

        {/* Related cards */}
        {related.length > 0 && (
          <div className="bg-surface rounded-2xl px-6 py-5 border border-border">
            <h3 className="text-[13px] font-semibold tracking-wide uppercase text-text mb-4">
              Related Cards
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {related.map((c) => {
                const relatedTierClass = TIER_CLASSES[c.tier] ?? 'bg-violet-500/10 text-accent';
                return (
                  <a
                    key={c.id}
                    href={`/cards/${c.id}`}
                    className="block px-4 py-3.5 rounded-xl border-[1.5px] border-border no-underline hover:border-text-muted transition-colors"
                  >
                    <p className="text-sm font-semibold text-text mb-1">
                      {c.name}
                    </p>
                    <p className="text-xs text-text-muted mb-2">{c.set}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${relatedTierClass}`}>
                      {TIER_LABELS[c.tier] ?? c.tier}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
