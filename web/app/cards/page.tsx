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
  } catch {
    // DB not ready
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
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Nav />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
            All Cards
          </h1>
          <p style={{ fontSize: 13, color: '#909090' }}>
            {CARDS.length} cards tracked · prices refresh every 6 hours
          </p>
        </div>
        <CardsTable cards={cards} />
      </main>
    </div>
  );
}
