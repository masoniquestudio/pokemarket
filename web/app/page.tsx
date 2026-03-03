import { getLatestIndex, getIndexHistory, getCardPriceChanges, getAllPriceHistory, getAllLatestIndices, getAllIndexHistories } from '../lib/db';
import { CARDS, INDEX_CONFIGS } from '../lib/cards';
import Nav from '../components/Nav';
import IndexChart from '../components/IndexChart';
import IndexTiles from '../components/IndexTiles';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allLatestIndices: Record<string, any> = {};
  let allIndexHistories: Record<string, { time: string; value: number }[]> = {};

  try {
    [latestIndex, indexHistory, priceChanges, allHistory, allLatestIndices, allIndexHistories] =
      await Promise.all([
        getLatestIndex('pmi'),
        getIndexHistory(90, 'pmi').then((rows) =>
          rows.map((r) => ({
            time: new Date(r.recorded_at).toISOString(),
            value: parseFloat(String(r.value)),
          }))
        ),
        getCardPriceChanges(),
        getAllPriceHistory(30),
        getAllLatestIndices(),
        getAllIndexHistories(30) as Promise<Record<string, { time: string; value: number }[]>>,
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

  // Build data for all 4 index tiles
  const indexTilesData = Object.entries(INDEX_CONFIGS).map(([id, config]) => {
    const latest = allLatestIndices[id];
    return {
      id,
      name: config.name,
      shortName: config.shortName,
      description: config.description,
      value: latest ? parseFloat(String(latest.value)) : 0,
      changePct: latest ? parseFloat(String(latest.change_pct)) : 0,
      history: allIndexHistories[id] ?? [],
    };
  });

  const pmiValue = latestIndex ? parseFloat(String(latestIndex.value)) : 0;
  const pmiChange = latestIndex ? parseFloat(String(latestIndex.change_pct)) : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
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
              color: 'var(--text)',
              marginBottom: 4,
            }}
          >
            Market Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Pokémon TCG price tracking · refreshes every 6 hours
          </p>
        </div>

        {/* PMI Chart */}
        <IndexChart
          data={indexHistory}
          currentValue={pmiValue}
          changePct={pmiChange}
        />

        {/* All 4 Index Tiles */}
        <IndexTiles indices={indexTilesData} />

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

const TIER_COLORS: Record<string, { bg: string; color: string }> = {
  vintage:        { bg: 'var(--tier-vintage-bg)',  color: 'var(--tier-vintage-color)' },
  iconic:         { bg: 'var(--tier-iconic-bg)',   color: 'var(--tier-iconic-color)' },
  'modern-chase': { bg: 'var(--tier-modern-bg)',   color: 'var(--tier-modern-color)' },
};

function AllCardsTable({ cards }: { cards: CardRow[] }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)',
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text)',
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
                  color: 'var(--text-muted)',
                  paddingBottom: 10,
                  borderBottom: '1px solid var(--border)',
                  paddingRight: i < 5 ? 16 : 0,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cards.map((card, i) => {
            const tierStyle = TIER_COLORS[card.tier] ?? { bg: 'rgba(124,58,237,0.1)', color: 'var(--accent)' };
            return (
              <tr
                key={card.id}
                style={{
                  borderBottom: i < cards.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <td style={{ padding: '11px 16px 11px 0' }}>
                  <a
                    href={`/cards/${card.id}`}
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text)',
                      textDecoration: 'none',
                    }}
                  >
                    {card.name}
                  </a>
                </td>
                <td
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
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
                      borderRadius: 12,
                      background: tierStyle.bg,
                      color: tierStyle.color,
                    }}
                  >
                    {TIER_LABELS[card.tier] ?? card.tier}
                  </span>
                </td>
                <td style={{ textAlign: 'right', padding: '11px 16px 11px 0' }}>
                  <span
                    className="num"
                    style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}
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
                          ? 'var(--text-muted)'
                          : card.changePct >= 0
                          ? 'var(--up)'
                          : 'var(--down)',
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
                    style={{ fontSize: 13, color: 'var(--text-muted)' }}
                  >
                    {card.volume ?? '—'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
