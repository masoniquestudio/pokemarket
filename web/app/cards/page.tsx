import { CARDS, INDEX_CONFIGS } from '../../lib/cards';
import { getCardPriceChanges } from '../../lib/db';
import Nav from '../../components/Nav';
import CardsTable from '../../components/CardsTable';

export const revalidate = 21600;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function CardsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let priceChanges: any[] = [];
  try {
    priceChanges = await getCardPriceChanges();
  } catch (err) {
    console.error('[CardsPage] getCardPriceChanges failed:', err);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceMap = Object.fromEntries(priceChanges.map((r: any) => [r.card_id, r]));

  const cards = CARDS.map((card) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = priceMap[card.id] as any;
    const currentPrice = row ? parseFloat(row.price_avg) : null;
    const prevPrice = row?.prev_price ? parseFloat(row.prev_price) : null;
    const changePct =
      currentPrice && prevPrice && prevPrice > 0
        ? Math.round(((currentPrice - prevPrice) / prevPrice) * 10000) / 100
        : null;

    // Which indices does this card belong to?
    const indices = Object.entries(INDEX_CONFIGS)
      .filter(([, config]) => config.cards.some((c: { id: string; weight: number }) => c.id === card.id))
      .map(([id]) => id);

    return {
      id: card.id,
      name: card.name,
      set: card.set,
      number: card.number,
      era: card.era,
      tier: card.tier,
      indices,
      currentPrice,
      changePct,
      volume: row?.volume ? parseInt(String(row.volume)) : null,
    };
  });

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-16">
        <div className="mb-5">
          <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-text-muted mb-2">
            All Cards
          </p>
          <p className="text-[13px] text-text-muted">
            {CARDS.length} graded cards tracked across vintage, iconic, and modern sets
          </p>
        </div>
        <CardsTable cards={cards} />
      </main>
    </div>
  );
}
