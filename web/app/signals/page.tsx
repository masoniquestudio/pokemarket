import Nav from '@/components/Nav';
import BuyLowCard from '@/components/BuyLowCard';
import PremiumGate from '@/components/PremiumGate';
import PremiumBadge from '@/components/PremiumBadge';
import { isPremiumUser } from '@/lib/premium-gate';
import { getCardPriceChangesMultiPeriod, getCardMovingAverages } from '@/lib/db';
import { CARDS } from '@/lib/cards';
import { processMultiPeriodChanges, calculateBuyLowSignals } from '@/lib/premium';

export const revalidate = 21600; // 6 hours

export default async function SignalsPage() {
  const premium = await isPremiumUser();

  const [priceRows, movingAverages] = await Promise.all([
    getCardPriceChangesMultiPeriod(),
    getCardMovingAverages(),
  ]);

  const cards = processMultiPeriodChanges(priceRows, CARDS);
  const buyLowSignals = calculateBuyLowSignals(cards, movingAverages);

  // Take top 20 signals
  const topSignals = buyLowSignals.slice(0, 20);

  return (
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="max-w-7xl mx-auto px-6 pt-8 pb-16">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-text">Buy Low Signals</h1>
            <PremiumBadge size="md" />
          </div>
          <p className="text-text-muted text-sm max-w-2xl">
            Cards that may be undervalued based on multiple technical indicators.
            A stronger signal means more criteria are met.
          </p>
        </div>

        {/* Signal criteria legend */}
        <div className="bg-surface border border-border rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
            Signal Criteria
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-text-muted">
            <span>Below 7d avg</span>
            <span className="text-border">|</span>
            <span>Below 30d avg</span>
            <span className="text-border">|</span>
            <span>Unusually low (1+ StdDev)</span>
            <span className="text-border">|</span>
            <span>High liquidity</span>
            <span className="text-border">|</span>
            <span>Strong long-term trend</span>
            <span className="text-border">|</span>
            <span>Recent pullback</span>
          </div>
        </div>

        {/* Signals grid */}
        <PremiumGate isPremium={premium} featureName="Buy Low Signals">
          {topSignals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {topSignals.map((card) => (
                <BuyLowCard key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted">
              <p>No buy signals found at this time.</p>
              <p className="text-sm mt-1">Check back later as the market moves.</p>
            </div>
          )}
        </PremiumGate>

        {/* Disclaimer */}
        <p className="text-xs text-text-muted/60 mt-8 text-center">
          Signals are based on technical analysis and do not constitute financial advice.
          Past performance does not guarantee future results.
        </p>
      </main>
    </div>
  );
}
