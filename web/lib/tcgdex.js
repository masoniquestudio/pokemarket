/**
 * TCGdex API wrapper for fetching Pokemon card prices.
 * Uses TCGPlayer pricing data aggregated by TCGdex, with Cardmarket fallback.
 * Free API, no authentication required.
 */

const TCGDEX_API_BASE = 'https://api.tcgdex.net/v2/en';

/**
 * Fetch card pricing from TCGdex API.
 * Returns normalized price stats compatible with our DB schema.
 *
 * @param {string} tcgdexId - Card ID in format "set-number" (e.g., "base1-4")
 * @returns {Promise<{ avg: number, low: number, high: number, volume: number | null } | null>}
 */
export async function fetchCardPrice(tcgdexId) {
  const res = await fetch(`${TCGDEX_API_BASE}/cards/${tcgdexId}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null; // Card not found
    }
    throw new Error(`TCGdex API error (${res.status})`);
  }

  const data = await res.json();
  const pricing = data.pricing;

  if (!pricing) {
    return null; // No pricing data available
  }

  // Try TCGPlayer pricing first (USD)
  const tcgplayer = pricing.tcgplayer;
  if (tcgplayer) {
    // TCGdex provides pricing for different variants: normal, holofoil, reverseHolofoil, etc.
    // Prioritize: holofoil > reverseHolofoil > normal > 1stEditionHolofoil > 1stEditionNormal
    const variant =
      tcgplayer.holofoil ||
      tcgplayer.reverseHolofoil ||
      tcgplayer.normal ||
      tcgplayer['1stEditionHolofoil'] ||
      tcgplayer['1stEditionNormal'] ||
      tcgplayer.unlimitedHolofoil ||
      null;

    if (variant) {
      const marketPrice = variant.marketPrice ?? variant.midPrice ?? null;
      const lowPrice = variant.lowPrice ?? null;
      const highPrice = variant.highPrice ?? null;

      if (marketPrice !== null) {
        return {
          avg: Math.round(marketPrice * 100) / 100,
          low: lowPrice ? Math.round(lowPrice * 100) / 100 : null,
          high: highPrice ? Math.round(highPrice * 100) / 100 : null,
          volume: null,
        };
      }
    }
  }

  // Fallback to Cardmarket pricing (EUR -> USD conversion ~1.08)
  const cardmarket = pricing.cardmarket;
  if (cardmarket && cardmarket.avg) {
    const eurToUsd = 1.08;
    return {
      avg: Math.round(cardmarket.avg * eurToUsd * 100) / 100,
      low: cardmarket.low ? Math.round(cardmarket.low * eurToUsd * 100) / 100 : null,
      high: null, // Cardmarket doesn't provide high price in the same format
      volume: null,
    };
  }

  return null;
}
