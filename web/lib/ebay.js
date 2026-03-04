/**
 * eBay Browse API wrapper.
 * All calls are server-side only — credentials never reach the client.
 */

const EBAY_API_BASE = 'https://api.ebay.com';
const EBAY_AUTH_URL = 'https://api.ebay.com/identity/v1/oauth2/token';

let _tokenCache = null; // { token: string, expiresAt: number }

/**
 * Fetch a client-credentials OAuth token from eBay.
 * Caches it in memory until 60s before expiry.
 */
export async function getEbayToken() {
  const now = Date.now();
  if (_tokenCache && _tokenCache.expiresAt > now) {
    return _tokenCache.token;
  }

  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(EBAY_AUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  _tokenCache = {
    token: data.access_token,
    // expires_in is in seconds; subtract 60s buffer
    expiresAt: now + (data.expires_in - 60) * 1000,
  };

  return _tokenCache.token;
}

// Keywords that indicate lots/bundles/bulk — filter these out before price calculation
const EXCLUDE_KEYWORDS = [
  'lot', 'bundle', 'set of', 'collection', 'bulk', 'random',
  'mystery', 'grab bag', 'pick', 'choose', 'binder', 'complete set'
];

// Minimum price thresholds by tier to filter out damaged/fake cards
const MIN_PRICE_BY_TIER = {
  vintage: 5,
  iconic: 50,
  'modern-chase': 5,
};

/**
 * Search eBay completed/sold listings for a given query.
 * Returns an array of sale prices (numbers).
 *
 * @param {string} query  - the ebayQuery string from cards.js
 * @param {number} limit  - max results to fetch (default 40)
 * @param {string} tier   - optional tier for minimum price filtering
 */
export async function fetchSoldPrices(query, limit = 100, tier = null) {
  const token = await getEbayToken();

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    filter: 'buyingOptions:{FIXED_PRICE},conditions:{USED}',
  });

  const res = await fetch(
    `${EBAY_API_BASE}/buy/browse/v1/item_summary/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAYS-US',
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay search failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  // Filter out lots/bundles/sets before extracting prices
  const items = (data.itemSummaries ?? []).filter((item) => {
    const title = (item.title ?? '').toLowerCase();
    return !EXCLUDE_KEYWORDS.some(kw => title.includes(kw));
  });

  // Get minimum price threshold for this tier
  const minPrice = tier ? (MIN_PRICE_BY_TIER[tier] ?? 0) : 0;

  // Extract numeric prices, applying minimum threshold
  const prices = items
    .map((item) => parseFloat(item.price?.value))
    .filter((p) => Number.isFinite(p) && p > minPrice);

  return prices;
}

/**
 * Given a raw array of prices, remove outliers and return summary stats.
 * Drops anything below 0.3× or above 3× the median.
 *
 * @param {number[]} prices
 * @returns {{ avg: number, low: number, high: number, volume: number } | null}
 */
export function summarisePrices(prices) {
  if (!prices.length) return null;

  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  const filtered = sorted.filter((p) => p >= median * 0.5 && p <= median * 2);
  if (!filtered.length) return null;

  const avg = filtered.reduce((s, p) => s + p, 0) / filtered.length;

  return {
    avg: Math.round(avg * 100) / 100,
    low: Math.round(filtered[0] * 100) / 100,
    high: Math.round(filtered[filtered.length - 1] * 100) / 100,
    volume: filtered.length,
  };
}

/**
 * Convenience: fetch + summarise in one call.
 *
 * @param {string} query
 * @returns {Promise<{ avg, low, high, volume } | null>}
 */
export async function fetchCardPriceStats(query) {
  const prices = await fetchSoldPrices(query);
  return summarisePrices(prices);
}
