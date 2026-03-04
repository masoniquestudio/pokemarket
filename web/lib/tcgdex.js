/**
 * PokéWallet API wrapper for fetching Pokemon card prices.
 * Uses TCGPlayer pricing data via the pokewallet.io v1 API.
 * Requires POKEWALLET_API_KEY env var.
 */

const POKEWALLET_API_BASE = 'https://api.pokewallet.io';

// Descriptors we append to card names that PokéWallet doesn't use
const NAME_SUFFIXES = [
  ' Alt Art', ' Full Art', ' SAR', ' SIR', ' Rainbow',
  ' Holo', ' VMAX', ' VSTAR',
];

function cleanName(name) {
  let n = name;
  for (const suffix of NAME_SUFFIXES) {
    if (n.endsWith(suffix)) n = n.slice(0, -suffix.length);
  }
  return n.trim();
}

// Normalize card number for comparison: "004/102" and "4/102" → "4/102"
// Strips leading zeros from the number part only
function normalizeNumber(num) {
  if (!num) return null;
  const parts = num.split('/');
  return `${parseInt(parts[0], 10)}/${parts[1]}`;
}

/**
 * Fetch card pricing from PokéWallet API.
 * Returns normalized price stats compatible with our DB schema.
 *
 * @param {{ name: string, set: string, number: string }} card
 * @returns {Promise<{ avg: number, low: number | null, high: number | null, volume: null } | null>}
 */
export async function fetchCardPrice(card) {
  const headers = { 'X-API-Key': process.env.POKEWALLET_API_KEY };

  const query = cleanName(card.name);
  const url = `${POKEWALLET_API_BASE}/search?q=${encodeURIComponent(query)}&limit=100`;

  const res = await fetch(url, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`PokéWallet API error (${res.status})`);
  }

  const json = await res.json();
  const results = json.results ?? [];

  const ourNumber = normalizeNumber(card.number);

  // Primary: exact card number match (most reliable — numbers are unique per set)
  let match = results.find(
    (r) => normalizeNumber(r.card_info?.card_number) === ourNumber
  );

  // Fallback: set name contains our set name (PokéWallet prefixes sets e.g. "SWSH07: Evolving Skies")
  if (!match) {
    match = results.find(
      (r) => r.card_info?.set_name?.toLowerCase().includes(card.set.toLowerCase())
    );
  }

  if (!match) return null;

  const prices = match.tcgplayer?.prices;
  if (!prices?.length) return null;

  // Fallback chain: Holofoil → Normal → Reverse Holofoil → first available
  const priority = ['Holofoil', 'Normal', 'Reverse Holofoil'];
  let variant = null;
  for (const name of priority) {
    variant = prices.find((p) => p.sub_type_name === name && p.market_price != null);
    if (variant) break;
  }
  if (!variant) {
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
