/**
 * pokemontcg.io API wrapper for fetching Pokemon card prices.
 * Uses TCGPlayer pricing data via the pokemontcg.io v2 API.
 * No auth required for basic tier; set POKEMONTCG_API_KEY for higher rate limits.
 */

const POKEMONTCG_API_BASE = 'https://api.pokemontcg.io/v2';

/**
 * Fetch card pricing from pokemontcg.io API.
 * Returns normalized price stats compatible with our DB schema.
 *
 * @param {{ name: string, set: string }} card
 * @returns {Promise<{ avg: number, low: number | null, high: number | null, volume: null } | null>}
 */
export async function fetchCardPrice(card) {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.POKEMONTCG_API_KEY) {
    headers['X-Api-Key'] = process.env.POKEMONTCG_API_KEY;
  }

  const q = `name:"${card.name}" set.name:"${card.set}"`;
  const url = `${POKEMONTCG_API_BASE}/cards?q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`pokemontcg.io API error (${res.status})`);
  }

  const json = await res.json();
  const cardData = json.data?.[0];

  if (!cardData) return null;

  const prices = cardData.tcgplayer?.prices;
  if (!prices) return null;

  const variant =
    prices.holofoil ??
    prices.normal ??
    prices.reverseHolofoil ??
    prices.firstEditionHolofoil ??
    null;

  if (!variant || variant.market == null) return null;

  return {
    avg: Math.round(variant.market * 100) / 100,
    low: variant.low != null ? Math.round(variant.low * 100) / 100 : null,
    high: variant.high != null ? Math.round(variant.high * 100) / 100 : null,
    volume: null,
  };
}
