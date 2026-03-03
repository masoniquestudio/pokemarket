import { getLatestIndex, getIndexHistory, getCardPriceChanges, getAllPriceHistory } from '../lib/db';
import { CARDS } from '../lib/cards';
import Nav from '../components/Nav';
import IndexChart from '../components/IndexChart';
import SectorTiles, { type SectorData } from '../components/SectorTiles';
import MoversTable, { type CardRow } from '../components/MoversTable';

export const revalidate = 21600;

// ─── Data helpers ────────────────────────────────────────────────────────────

/** Aggregate daily average price for a set of card_ids from the raw history */
function buildSectorHistory(
  allHistory: { card_id: string; price_avg: string | number; recorded_at: Date }[],
  cardIds: string[]
): { value: number }[] {
  const idSet = new Set(cardIds);

  // Bucket by calendar day
  const byDay: Record<string, number[]> = {};
  for (const row of allHistory) {
    if (!idSet.has(row.card_id)) continue;
    const day = new Date(row.recorded_at).toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(parseFloat(String(row.price_avg)));
  }

  const days = Object.keys(byDay).sort();
  if (days.length < 2) return [];

  // Normalise to % change from first day so sparklines are comparable
  const series = days.map((day) => {
    const prices = byDay[day];
    return prices.reduce((s, p) => s + p, 0) / prices.length;
  });

  const base = series[0];
  return series.map((v) => ({ value: base > 0 ? ((v - base) / base) * 100 : 0 }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // Fetch everything — graceful fallback if DB isn't ready yet
  let latestIndex = null;
  let indexHistory: { time: string; value: number }[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let priceChanges: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allHistory: any[] = [];

  try {
    [latestIndex, indexHistory, priceChanges, allHistory] = await Promise.all([
      getLatestIndex(),
      getIndexHistory(90).then((rows) =>
        rows.map((r) => ({
          time: new Date(r.recorded_at).toISOString(),
          value: parseFloat(String(r.value)),
        }))
      ),
      getCardPriceChanges(),
      getAllPriceHistory(30),
    ]);
  } catch {
    // DB not configured yet — show empty state
  }

  // Merge price data with card metadata
  const priceMap = Object.fromEntries(
    priceChanges.map((r) => [r.card_id, r])
  );

  const cardsWithPrices: CardRow[] = CARDS.map((card) => {
    const row = priceMap[card.id];
    const currentPrice = row ? parseFloat(row.price_avg) : 0;
    const prevPrice = row?.prev_price ? parseFloat(row.prev_price) : null;
    const changePct =
      prevPrice && prevPrice > 0
        ? Math.round(((currentPrice - prevPrice) / prevPrice) * 10000) / 100
        : null;

    return {
      id: card.id,
      name: card.name,
      set: card.set,
      tier: card.tier,
      currentPrice,
      changePct,
      volume: row?.volume ? parseInt(String(row.volume)) : null,
    };
  });

  // Gainers / losers — only cards that have price data + a 7d comparison
  const priced = cardsWithPrices.filter(
    (c) => c.currentPrice > 0 && c.changePct !== null
  );
  const gainers = [...priced]
    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))
    .slice(0, 5);
  const losers = [...priced]
    .sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0))
    .slice(0, 5);

  // Sector tiles
  const SECTORS: { tier: string; label: string }[] = [
    { tier: 'vintage', label: 'Vintage' },
    { tier: 'iconic', label: 'Iconic' },
    { tier: 'modern-chase', label: 'Modern Chase' },
  ];

  const sectors: SectorData[] = SECTORS.map(({ tier, label }) => {
    const cards = CARDS.filter((c) => c.tier === tier);
    const cardIds = cards.map((c) => c.id);
    const cardRows = cardsWithPrices.filter((c) => c.tier === tier && c.changePct !== null);
    const avgChangePct =
      cardRows.length > 0
        ? Math.round(
            (cardRows.reduce((s, c) => s + (c.changePct ?? 0), 0) / cardRows.length) * 100
          ) / 100
        : null;

    return {
      tier,
      label,
      cardCount: cards.length,
      avgChangePct,
      history: buildSectorHistory(allHistory, cardIds),
    };
  });

  const pmiValue = latestIndex ? parseFloat(String(latestIndex.value)) : 0;
  const pmiChange = latestIndex ? parseFloat(String(latestIndex.change_pct)) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Nav />

      <main
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '32px 24px 64px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Page title */}
        <div style={{ marginBottom: 4 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: 4,
            }}
          >
            Market Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#909090' }}>
            Pokémon TCG price tracking · refreshes every 6 hours
          </p>
        </div>

        {/* PMI Chart */}
        <IndexChart
          data={indexHistory}
          currentValue={pmiValue}
          changePct={pmiChange}
        />

        {/* Sector tiles */}
        <SectorTiles sectors={sectors} />

        {/* Gainers / Losers */}
        <MoversTable gainers={gainers} losers={losers} />

        {/* All cards table */}
        <AllCardsTable cards={cardsWithPrices} />
      </main>
    </div>
  );
}

// ─── All Cards table (inline, server-rendered) ────────────────────────────────

const TIER_LABELS: Record<string, string> = {
  vintage: 'Vintage',
  iconic: 'Iconic',
  'modern-chase': 'Modern Chase',
};

function AllCardsTable({ cards }: { cards: CardRow[] }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#1a1a1a',
          marginBottom: 16,
        }}
      >
        All Cards
      </h3>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Card', 'Set', 'Tier', 'Price', '7d %', 'Volume'].map((h, i) => (
              <th
                key={h}
                style={{
                  textAlign: i >= 3 ? 'right' : 'left',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#bbb',
                  paddingBottom: 10,
                  borderBottom: '1px solid #f0f0f0',
                  paddingRight: i < 5 ? 16 : 0,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cards.map((card, i) => (
            <tr
              key={card.id}
              style={{
                borderBottom: i < cards.length - 1 ? '1px solid #f9f9f9' : 'none',
              }}
            >
              <td style={{ padding: '11px 16px 11px 0' }}>
                <a
                  href={`/cards/${card.id}`}
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#1a1a1a',
                    textDecoration: 'none',
                  }}
                >
                  {card.name}
                </a>
              </td>
              <td
                style={{
                  fontSize: 13,
                  color: '#909090',
                  padding: '11px 16px 11px 0',
                }}
              >
                {card.set}
              </td>
              <td style={{ padding: '11px 16px 11px 0' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background:
                      card.tier === 'vintage'
                        ? '#fff8e1'
                        : card.tier === 'iconic'
                        ? '#fce4ec'
                        : '#e8f5e9',
                    color:
                      card.tier === 'vintage'
                        ? '#b8860b'
                        : card.tier === 'iconic'
                        ? '#c62828'
                        : '#2e7d32',
                  }}
                >
                  {TIER_LABELS[card.tier] ?? card.tier}
                </span>
              </td>
              <td style={{ textAlign: 'right', padding: '11px 16px 11px 0' }}>
                <span
                  className="num"
                  style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}
                >
                  {card.currentPrice > 0
                    ? `$${card.currentPrice.toFixed(2)}`
                    : '—'}
                </span>
              </td>
              <td style={{ textAlign: 'right', padding: '11px 16px 11px 0' }}>
                <span
                  className="num"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color:
                      card.changePct === null
                        ? '#ccc'
                        : card.changePct >= 0
                        ? '#00c853'
                        : '#ff3d00',
                  }}
                >
                  {card.changePct === null
                    ? '—'
                    : `${card.changePct >= 0 ? '+' : ''}${card.changePct.toFixed(2)}%`}
                </span>
              </td>
              <td style={{ textAlign: 'right', padding: '11px 0' }}>
                <span
                  className="num"
                  style={{ fontSize: 13, color: '#909090' }}
                >
                  {card.volume ?? '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
