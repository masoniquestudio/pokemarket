/**
 * Premium analytics functions for multi-timeframe analysis and Buy Low signals.
 */

/**
 * Calculate percent change between current and previous price.
 */
export function calcChangePct(current, previous) {
  if (!current || !previous || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

/**
 * Process multi-period price data into card objects with all change percentages.
 */
export function processMultiPeriodChanges(priceRows, cardsConfig) {
  const priceMap = Object.fromEntries(priceRows.map((r) => [r.card_id, r]));

  return cardsConfig
    .map((card) => {
      const row = priceMap[card.id];
      if (!row) return null;

      const currentPrice = parseFloat(row.price_avg);

      return {
        id: card.id,
        name: card.name,
        set: card.set,
        tier: card.tier,
        era: card.era,
        currentPrice,
        volume: row.volume ? parseInt(row.volume) : null,
        change1d: calcChangePct(
          currentPrice,
          row.price_1d ? parseFloat(row.price_1d) : null
        ),
        change7d: calcChangePct(
          currentPrice,
          row.price_7d ? parseFloat(row.price_7d) : null
        ),
        change30d: calcChangePct(
          currentPrice,
          row.price_30d ? parseFloat(row.price_30d) : null
        ),
        change90d: calcChangePct(
          currentPrice,
          row.price_90d ? parseFloat(row.price_90d) : null
        ),
      };
    })
    .filter(Boolean);
}

/**
 * Get top gainers and losers for a specific time period.
 * @param {Array} cards - Cards with change data
 * @param {'1d'|'7d'|'30d'|'90d'} period - Time period
 * @param {number} limit - Max cards to return per category
 */
export function getMovers(cards, period = '7d', limit = 10) {
  const changeKey = `change${period}`;

  const withChanges = cards.filter((c) => c[changeKey] !== null);

  const gainers = [...withChanges]
    .sort((a, b) => (b[changeKey] ?? 0) - (a[changeKey] ?? 0))
    .slice(0, limit);

  const losers = [...withChanges]
    .sort((a, b) => (a[changeKey] ?? 0) - (b[changeKey] ?? 0))
    .slice(0, limit);

  return { gainers, losers };
}

/**
 * Calculate "Buy Low" signals for cards.
 * A card is flagged if it meets 2+ of these criteria:
 * - Below 7-day SMA
 * - Below 30-day SMA
 * - Below 1 StdDev from 30-day mean
 * - High volume (above tier median)
 * - Positive 90-day trend
 * - Recent dip (7d down, 30d up)
 *
 * @param {Array} cards - Cards with multi-period change data
 * @param {Array} movingAverages - Moving average data from getCardMovingAverages()
 * @returns {Array} Cards with buy signals, sorted by signal strength
 */
export function calculateBuyLowSignals(cards, movingAverages) {
  const maMap = Object.fromEntries(movingAverages.map((r) => [r.card_id, r]));

  // Calculate median volume by tier
  const volumeByTier = {};
  cards.forEach((c) => {
    if (!volumeByTier[c.tier]) volumeByTier[c.tier] = [];
    if (c.volume) volumeByTier[c.tier].push(c.volume);
  });
  const medianVolume = Object.fromEntries(
    Object.entries(volumeByTier).map(([tier, vols]) => {
      const sorted = [...vols].sort((a, b) => a - b);
      return [tier, sorted[Math.floor(sorted.length / 2)] ?? 0];
    })
  );

  const signals = cards
    .map((card) => {
      const ma = maMap[card.id];
      if (!ma || !card.currentPrice) return null;

      const criteria = [];
      const currentPrice = card.currentPrice;
      const sma7d = ma.sma_7d ? parseFloat(ma.sma_7d) : null;
      const sma30d = ma.sma_30d ? parseFloat(ma.sma_30d) : null;
      const stddev30d = ma.stddev_30d ? parseFloat(ma.stddev_30d) : null;

      // Criterion 1: Below 7-day SMA
      if (sma7d && currentPrice < sma7d) {
        criteria.push({
          name: 'below_sma7d',
          label: 'Below 7d avg',
          discount: ((sma7d - currentPrice) / sma7d) * 100,
        });
      }

      // Criterion 2: Below 30-day SMA
      if (sma30d && currentPrice < sma30d) {
        criteria.push({
          name: 'below_sma30d',
          label: 'Below 30d avg',
          discount: ((sma30d - currentPrice) / sma30d) * 100,
        });
      }

      // Criterion 3: More than 1 StdDev below 30-day mean
      if (sma30d && stddev30d && stddev30d > 0 && currentPrice < sma30d - stddev30d) {
        criteria.push({
          name: 'below_stddev',
          label: 'Unusually low',
          zscore: (currentPrice - sma30d) / stddev30d,
        });
      }

      // Criterion 4: High volume (above tier median)
      if (card.volume && card.volume > (medianVolume[card.tier] ?? 0)) {
        criteria.push({
          name: 'high_volume',
          label: 'High liquidity',
          volume: card.volume,
        });
      }

      // Criterion 5: Positive 90-day trend
      if (card.change90d && card.change90d > 5) {
        criteria.push({
          name: 'positive_90d',
          label: 'Strong long-term',
          change: card.change90d,
        });
      }

      // Criterion 6: Recent dip (7d down, 30d up)
      if (card.change7d && card.change7d < -3 && card.change30d && card.change30d > 0) {
        criteria.push({
          name: 'recent_dip',
          label: 'Recent pullback',
          dip7d: card.change7d,
          gain30d: card.change30d,
        });
      }

      // Need at least 2 criteria for a signal
      if (criteria.length < 2) return null;

      // Calculate discount from 30d SMA
      const discountPct = sma30d
        ? ((sma30d - currentPrice) / sma30d) * 100
        : null;

      // Boost signal strength based on discount magnitude
      // A 20%+ discount adds 1 point, 40%+ adds 2
      let strengthBonus = 0;
      if (discountPct && discountPct > 40) {
        strengthBonus = 2;
      } else if (discountPct && discountPct > 20) {
        strengthBonus = 1;
      }

      return {
        ...card,
        signalStrength: Math.min(criteria.length + strengthBonus, 5),
        criteria,
        discountPct: discountPct && discountPct > 0 ? discountPct : null,
        sma30d,
      };
    })
    .filter(Boolean);

  // Sort by signal strength (most criteria met first), then by discount
  return signals.sort((a, b) => {
    if (b.signalStrength !== a.signalStrength) {
      return b.signalStrength - a.signalStrength;
    }
    return (b.discountPct ?? 0) - (a.discountPct ?? 0);
  });
}

/**
 * Calculate change percentages for index values.
 */
export function processIndexChanges(indexData) {
  if (!indexData) return null;

  const current = parseFloat(indexData.current_value);

  return {
    current,
    change1d: calcChangePct(current, indexData.value_1d ? parseFloat(indexData.value_1d) : null),
    change7d: calcChangePct(current, indexData.value_7d ? parseFloat(indexData.value_7d) : null),
    change30d: calcChangePct(current, indexData.value_30d ? parseFloat(indexData.value_30d) : null),
    change90d: calcChangePct(current, indexData.value_90d ? parseFloat(indexData.value_90d) : null),
  };
}
