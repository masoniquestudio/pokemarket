import { CARDS } from '../../../lib/cards';
import { getLatestPrices, getBaselinePrice, insertIndexSnapshot, getLatestIndex } from '../../../lib/db';
import { computePMI, computeChangePct } from '../../../lib/index';

export const revalidate = 21600;

export async function GET() {
  try {
    // Fetch latest price snapshot for every card
    const latestPrices = await getLatestPrices();
    const priceMap = Object.fromEntries(latestPrices.map((r) => [r.card_id, r]));

    // Build inputs for PMI — only cards that have both a current and baseline price
    const inputs = [];
    for (const card of CARDS) {
      const current = priceMap[card.id];
      if (!current) continue;

      const baseline = await getBaselinePrice(card.id);
      if (!baseline) continue;

      inputs.push({
        cardId: card.id,
        currentPrice: parseFloat(current.price_avg),
        baselinePrice: parseFloat(baseline.price_avg),
        weight: card.weight,
      });
    }

    if (!inputs.length) {
      return Response.json(
        { ok: false, error: 'No price data available yet. Run /api/prices first.' },
        { status: 422 }
      );
    }

    const value = computePMI(inputs);

    // Get yesterday's index value to compute change %
    const previous = await getLatestIndex();
    const changePct = previous ? computeChangePct(value, parseFloat(previous.value)) : 0;

    await insertIndexSnapshot({ value, changePct });

    return Response.json({
      ok: true,
      value,
      changePct,
      cardsIncluded: inputs.length,
      cardsTotal: CARDS.length,
    });
  } catch (err) {
    console.error('Index computation error:', err.message);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
