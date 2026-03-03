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

const TIER_COLORS: Record<string, { bg: string; color: string }> = {
  vintage:        { bg: 'var(--tier-vintage-bg)',  color: 'var(--tier-vintage-color)' },
  iconic:         { bg: 'var(--tier-iconic-bg)',   color: 'var(--tier-iconic-color)' },
  'modern-chase': { bg: 'var(--tier-modern-bg)',   color: 'var(--tier-modern-color)' },
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

  // eBay search URL
  const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card.ebayQuery)}&LH_Sold=1&LH_Complete=1`;

  // Snapshot table — most recent first, cap at 30
  const tableRows = [...history].reverse().slice(0, 30);

  const tierStyle = TIER_COLORS[card.tier] ?? { bg: 'rgba(52,102,175,0.25)', color: '#a0b8d8' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav />

      <main
        style={{
          maxWidth: 1024,
          margin: '0 auto',
          padding: '32px 24px 64px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Breadcrumb */}
        <a
          href="/"
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← All Cards
        </a>

        {/* Card header */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 16,
            padding: '24px 28px',

            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                {card.name}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {card.set} · #{card.number} · {card.era}
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: 999,
                background: tierStyle.bg,
                color: tierStyle.color,
                alignSelf: 'flex-start',
              }}
            >
              {TIER_LABELS[card.tier] ?? card.tier}
            </span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32, marginTop: 24, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Current Avg
              </p>
              <span className="num" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                {latest != null ? `$${latest.toFixed(2)}` : '—'}
              </span>
            </div>
            {[{ label: '7d Change', val: change7d }, { label: '30d Change', val: change30d }].map(({ label, val }) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                  {label}
                </p>
                <span
                  className="num"
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: val === null ? 'var(--text-muted)' : val >= 0 ? 'var(--up)' : 'var(--down)',
                  }}
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
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 16,
            padding: '20px 24px',

            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text)' }}>
              Price History
            </h3>
            <a
              href={ebayUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--accent)',
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 999,
                border: '1.5px solid var(--border)',
              }}
            >
              View on eBay →
            </a>
          </div>

          {tableRows.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Avg Price', 'Low', 'High', 'Volume'].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        textAlign: i === 0 ? 'left' : 'right',
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--text-muted)',
                        paddingBottom: 10,
                        borderBottom: '1px solid var(--border)',
                        paddingRight: i < 4 ? 16 : 0,
                      }}
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
                    <tr key={new Date(row.recorded_at).toISOString()} style={{ borderBottom: i < tableRows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '10px 16px 10px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                        {new Date(row.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="num" style={{ textAlign: 'right', padding: '10px 16px 10px 0', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                        ${avg.toFixed(2)}
                      </td>
                      <td className="num" style={{ textAlign: 'right', padding: '10px 16px 10px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                        {low != null ? `$${low.toFixed(2)}` : '—'}
                      </td>
                      <td className="num" style={{ textAlign: 'right', padding: '10px 16px 10px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                        {high != null ? `$${high.toFixed(2)}` : '—'}
                      </td>
                      <td className="num" style={{ textAlign: 'right', padding: '10px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                        {row.volume ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
              No price data yet — run /api/prices to seed data
            </p>
          )}
        </div>

        {/* Related cards */}
        {related.length > 0 && (
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              padding: '20px 24px',
  
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 16 }}>
              Related Cards
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {related.map((c) => {
                const cs = TIER_COLORS[c.tier] ?? { bg: 'rgba(124,58,237,0.1)', color: 'var(--accent)' };
                return (
                  <a
                    key={c.id}
                    href={`/cards/${c.id}`}
                    style={{
                      display: 'block',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '1.5px solid var(--border)',
                      textDecoration: 'none',
                    }}
                  >
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      {c.name}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{c.set}</p>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: cs.bg,
                        color: cs.color,
                      }}
                    >
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
