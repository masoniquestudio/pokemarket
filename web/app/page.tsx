import Link from 'next/link';
import { getLatestIndex, getIndexHistory, getCardPriceChanges, getAllLatestIndices, getAllIndexHistories, getCardPriceChangesMultiPeriod, getCardMovingAverages } from '../lib/db';
import { CARDS, INDEX_CONFIGS } from '../lib/cards';
import { processMultiPeriodChanges, getMovers, calculateBuyLowSignals } from '../lib/premium';
import { isPremiumUser } from '../lib/premium-gate';
import Nav from '../components/Nav';
import IndexChart from '../components/IndexChart';
import IndexTiles from '../components/IndexTiles';
import MarketStats from '../components/MarketStats';
import MoversTable, { type CardRow } from '../components/MoversTable';
import PremiumGate from '../components/PremiumGate';
import PremiumBadge from '../components/PremiumBadge';

export const revalidate = 21600;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const premium = await isPremiumUser();

  // Fetch everything — graceful fallback if DB isn't ready yet
  let latestIndex = null;
  let indexHistory: { time: string; value: number }[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let priceChanges: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allLatestIndices: Record<string, any> = {};
  let allIndexHistories: Record<string, { time: string; value: number }[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let multiPeriodPrices: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let movingAverages: any[] = [];

  try {
    [latestIndex, indexHistory, priceChanges, allLatestIndices, allIndexHistories, multiPeriodPrices, movingAverages] =
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
        getCardPriceChangesMultiPeriod(),
        getCardMovingAverages(),
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
  const mostActive = pricedCards
    .filter((c) => c.volume !== null)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))[0] ?? null;

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

  // Premium data: multi-period changes and buy low signals
  const multiPeriodCards = processMultiPeriodChanges(multiPeriodPrices, CARDS);
  const dailyMovers = getMovers(multiPeriodCards, '1d', 5);
  const buyLowSignals = calculateBuyLowSignals(multiPeriodCards, movingAverages).slice(0, 4);

  return (
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="max-w-7xl mx-auto px-6 pt-8 pb-16 flex flex-col gap-5">
        {/* Page title */}
        <div className="mb-2">
          <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted">
            Live TCGPlayer Data · Updated Every 6 Hours
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
          mostActive={mostActive ? { name: mostActive.name, volume: mostActive.volume ?? 0 } : null}
        />

        {/* Gainers / Losers (7-day, free) */}
        <MoversTable gainers={gainers} losers={losers} period="7d" />

        {/* Daily Movers (24h, premium) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[13px] font-semibold tracking-wide uppercase text-text">
              Daily Movers
            </h2>
            <PremiumBadge />
          </div>
          <PremiumGate isPremium={premium} featureName="24-hour movers">
            <MoversTable
              gainers={dailyMovers.gainers.map(c => ({ ...c, changePct: c.change1d }))}
              losers={dailyMovers.losers.map(c => ({ ...c, changePct: c.change1d }))}
              period="1d"
            />
          </PremiumGate>
        </div>

        {/* Buy Low Signals Preview (premium) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold tracking-wide uppercase text-text">
                Buy Low Signals
              </h2>
              <PremiumBadge />
            </div>
            <Link href="/signals" className="text-[13px] font-semibold text-accent no-underline">
              View all →
            </Link>
          </div>
          <PremiumGate isPremium={premium} featureName="buy low signals">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {buyLowSignals.length > 0 ? (
                buyLowSignals.map((card) => (
                  <Link
                    key={card.id}
                    href={`/cards/${card.id}`}
                    className="bg-surface border border-border rounded-xl p-4 hover:border-amber-500/50 transition-colors no-underline"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text text-sm truncate">{card.name}</p>
                        <p className="text-xs text-text-muted truncate">{card.set}</p>
                      </div>
                      <div className="flex gap-0.5 ml-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              i <= card.signalStrength ? 'bg-amber-400' : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="num font-bold text-text">${card.currentPrice.toFixed(2)}</span>
                      {card.discountPct && card.discountPct > 0 && (
                        <span className="text-xs text-green-400">
                          {card.discountPct.toFixed(1)}% below avg
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-text-muted text-sm">
                  No buy signals at this time
                </div>
              )}
            </div>
          </PremiumGate>
        </div>

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
