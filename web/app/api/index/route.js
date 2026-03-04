import { INDEX_CONFIGS } from '../../../lib/cards';
import { getLatestPrices, getBaselinePrice, insertIndexSnapshot, getIndex7DaysAgo } from '../../../lib/db';
import { computePMI, computeChangePct } from '../../../lib/index';

export const revalidate = 21600;

export async function GET() {
  try {
    const latestPrices = await getLatestPrices();
    const priceMap = Object.fromEntries(latestPrices.map((r) => [r.card_id, r]));

    const results = {};

    for (const [indexId, config] of Object.entries(INDEX_CONFIGS)) {
      const inputs = [];

      for (const { id, weight } of config.cards) {
        const current = priceMap[id];
        if (!current) continue;

        const baseline = await getBaselinePrice(id);
        if (!baseline) continue;

        inputs.push({
          cardId: id,
          currentPrice: parseFloat(current.price_avg),
          baselinePrice: parseFloat(baseline.price_avg),
          weight,
        });
      }

      if (!inputs.length) {
        results[indexId] = { skipped: true, reason: 'no price data' };
        continue;
      }

      const value = computePMI(inputs);
      const weekAgo = await getIndex7DaysAgo(indexId);
      const changePct = weekAgo ? computeChangePct(value, parseFloat(weekAgo.value)) : 0;

      await insertIndexSnapshot({ indexId, value, changePct });

      results[indexId] = {
        name: config.name,
        value,
        changePct,
        cardsIncluded: inputs.length,
        cardsTotal: config.cards.length,
      };
    }

    return Response.json({ ok: true, results });
  } catch (err) {
    console.error('Index computation error:', err.message);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
