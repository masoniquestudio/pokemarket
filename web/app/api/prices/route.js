import { CARDS } from '../../../lib/cards';
import { fetchCardPriceStats } from '../../../lib/ebay';
import { insertPriceSnapshot } from '../../../lib/db';

// Revalidate every 6 hours
export const revalidate = 21600;

export async function GET() {
  const results = [];
  const errors = [];

  for (const card of CARDS) {
    try {
      const stats = await fetchCardPriceStats(card.ebayQuery);

      if (!stats) {
        errors.push({ cardId: card.id, reason: 'no usable price data returned' });
        continue;
      }

      await insertPriceSnapshot({
        cardId: card.id,
        priceAvg: stats.avg,
        priceLow: stats.low,
        priceHigh: stats.high,
        volume: stats.volume,
      });

      results.push({ cardId: card.id, ...stats });
    } catch (err) {
      console.error(`Price fetch failed for ${card.id}:`, err.message);
      errors.push({ cardId: card.id, reason: err.message });
    }
  }

  return Response.json({
    ok: true,
    updated: results.length,
    skipped: errors.length,
    results,
    errors,
  });
}
