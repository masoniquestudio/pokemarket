/**
 * PokéWallet API wrapper for fetching Pokemon card prices.
 * Uses TCGPlayer pricing data via the pokewallet.io v1 API.
 * Requires POKEWALLET_API_KEY env var.
 */

const POKEWALLET_API_BASE = 'https://api.pokewallet.io';

/**
 * Fetch card pricing from PokéWallet API.
 * Returns normalized price stats compatible with our DB schema.
 *
 * @param {{ name: string, set: string }} card
 * @returns {Promise<{ avg: number, low: number | null, high: number | null, volume: null } | null>}
 */
export async function fetchCardPrice(card) {
  const headers = { 'X-API-Key': process.env.POKEWALLET_API_KEY };

  const url = `${POKEWALLET_API_BASE}/search?q=${encodeURIComponent(card.name)}&limit=100`;

  const res = await fetch(url, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`PokéWallet API error (${res.status})`);
  }

  const json = await res.json();
  const results = json.results ?? [];

  // Match by set name
  const match = results.find(
    (r) => r.card_info?.set_name?.toLowerCase() === card.set.toLowerCase()
  );

  if (!match) return null;

  const prices = match.tcgplayer?.prices;
  if (!prices?.length) return null;

  // Fallback chain: Holofoil → Normal → Reverse Holofoil
  const priority = ['Holofoil', 'Normal', 'Reverse Holofoil'];
  let variant = null;
  for (const name of priority) {
    variant = prices.find((p) => p.sub_type_name === name);
    if (variant?.market_price != null) break;
  }
  if (!variant?.market_price) {
    // Last resort: first entry with a market price
    variant = prices.find((p) => p.market_price != null);
  }

  if (!variant?.market_price) return null;

  return {
    avg: Math.round(variant.market_price * 100) / 100,
    low: variant.low_price != null ? Math.round(variant.low_price * 100) / 100 : null,
    high: variant.high_price != null ? Math.round(variant.high_price * 100) / 100 : null,
    volume: null,
  };
}
