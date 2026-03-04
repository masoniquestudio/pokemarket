import { getLatestIndex, getIndexHistory, getCardPriceChanges, getAllLatestIndices, getAllIndexHistories } from '../lib/db';
import { CARDS, INDEX_CONFIGS } from '../lib/cards';
import Nav from '../components/Nav';
import IndexChart from '../components/IndexChart';
import IndexTiles from '../components/IndexTiles';
import MarketStats from '../components/MarketStats';
import MoversTable, { type CardRow } from '../components/MoversTable';

export const revalidate = 21600;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // Fetch everything — graceful fallback if DB isn't ready yet
  let latestIndex = null;
  let indexHistory: { time: string; value: number }[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let priceChanges: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allLatestIndices: Record<string, any> = {};
  let allIndexHistories: Record<string, { time: string; value: number }[]> = {};

  try {
    [latestIndex, indexHistory, priceChanges, allLatestIndices, allIndexHistories] =
      await Promise.all([
        getLatestIndex('pmi'),
        getIndexHistory(90, 'pmi').then((rows) =>
          rows.map((r) => ({
            time: new Date(r.recorded_at).toISOString(),
            value: parseFloat(String(r.value)),
          }))
        ),
        getCardPriceChanges(),
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

  // Market stats
  const pricedCards = cardsWithPrices.filter((c) => c.currentPrice > 0);
  const totalMarketCap = pricedCards.reduce((sum, c) => sum + c.currentPrice, 0);
  const totalVolume = pricedCards.reduce((sum, c) => sum + (c.volume ?? 0), 0);
  const cardsWithChange = pricedCards.filter((c) => c.changePct !== null);
  const avgChange = cardsWithChange.length > 0
    ? cardsWithChange.reduce((sum, c) => sum + (c.changePct ?? 0), 0) / cardsWithChange.length
    : 0;
  const mostActive = pricedCards
    .filter((c) => c.volume !== null)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))[0] ?? null;
  const marketSentiment = {
    up: cardsWithChange.filter((c) => (c.changePct ?? 0) > 0).length,
    down: cardsWithChange.filter((c) => (c.changePct ?? 0) < 0).length,
    neutral: cardsWithChange.filter((c) => (c.changePct ?? 0) === 0).length,
  };

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
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="max-w-7xl mx-auto px-6 pt-8 pb-16 flex flex-col gap-5">
        {/* Page title */}
        <div className="mb-2">
          <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
            Live eBay Data · Updated Every 6 Hours
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

        {/* Market Stats */}
        <MarketStats
          totalCards={pricedCards.length}
          totalMarketCap={totalMarketCap}
          totalVolume={totalVolume}
          avgChange={avgChange}
          mostActive={mostActive ? { name: mostActive.name, volume: mostActive.volume ?? 0 } : null}
          marketSentiment={marketSentiment}
        />

        {/* Gainers / Losers */}
        <MoversTable gainers={gainers} losers={losers} />

        {/* Top cards summary */}
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

const TIER_CLASSES: Record<string, string> = {
  vintage: 'bg-tier-vintage-bg text-tier-vintage',
  iconic: 'bg-tier-iconic-bg text-tier-iconic',
  'modern-chase': 'bg-tier-modern-bg text-tier-modern',
};

function AllCardsTable({ cards }: { cards: CardRow[] }) {
  const priced = cards
    .filter((c) => c.currentPrice > 0)
    .sort((a, b) => b.currentPrice - a.currentPrice)
    .slice(0, 10);

  return (
    <div className="bg-surface rounded-2xl px-6 py-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold tracking-wide uppercase text-text">
          Top Cards
        </h3>
        <a
          href="/cards"
          className="text-[13px] font-semibold text-accent no-underline"
        >
          View all {cards.filter((c) => c.currentPrice > 0).length} cards →
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr>
              {['Card', 'Set', 'Tier', 'Avg Price', 'Chg %', 'Volume'].map((h, i) => (
                <th
                  key={h}
                  className={`${i >= 3 ? 'text-right' : 'text-left'} text-[11px] font-medium text-text-muted pb-2.5 border-b border-border ${
                    i < 5 ? 'pr-4' : ''
                  } ${i === 1 || i === 2 ? 'hidden md:table-cell' : ''} ${i === 5 ? 'hidden lg:table-cell' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {priced.map((card, i) => {
              const tierClass = TIER_CLASSES[card.tier] ?? 'bg-violet-500/10 text-accent';
              return (
                <tr
                  key={card.id}
                  className={i < priced.length - 1 ? 'border-b border-border' : ''}
                >
                  <td className="py-2.5 pr-4">
                    <a
                      href={`/cards/${card.id}`}
                      className="text-sm font-semibold text-text no-underline"
                    >
                      {card.name}
                    </a>
                  </td>
                  <td className="text-[13px] text-text-muted py-2.5 pr-4 hidden md:table-cell">
                    {card.set}
                  </td>
                  <td className="py-2.5 pr-4 hidden md:table-cell">
                    <span className={`text-[11px] font-semibold py-0.5 px-2 rounded-xl ${tierClass}`}>
                      {TIER_LABELS[card.tier] ?? card.tier}
                    </span>
                  </td>
                  <td className="text-right py-2.5 pr-4">
                    <span className="num text-sm font-semibold text-text">
                      {card.currentPrice > 0 ? `$${card.currentPrice.toFixed(2)}` : '—'}
                    </span>
                  </td>
                  <td className="text-right py-2.5 pr-4">
                    <span
                      className={`num text-[13px] font-bold ${
                        card.changePct === null
                          ? 'text-text-muted'
                          : card.changePct >= 0
                          ? 'text-up'
                          : 'text-down'
                      }`}
                    >
                      {card.changePct === null
                        ? '—'
                        : `${card.changePct >= 0 ? '+' : ''}${card.changePct.toFixed(2)}%`}
                    </span>
                  </td>
                  <td className="text-right py-2.5 hidden lg:table-cell">
                    <span className="num text-[13px] text-text-muted">
                      {card.volume ?? '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
