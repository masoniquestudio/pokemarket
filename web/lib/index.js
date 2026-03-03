/**
 * PMI (PokéMarket Index) calculation logic.
 * Pure functions — no DB or network calls here.
 *
 * Formula: PMI = Σ (currentPrice / baselinePrice × weight) × 1000
 * Baseline PMI = 1000 points (Day 1 prices)
 */

/**
 * Compute the PMI value from current prices and baselines.
 *
 * @param {Array<{ cardId: string, currentPrice: number, baselinePrice: number, weight: number }>} inputs
 * @returns {number} PMI value rounded to 2 decimal places
 */
export function computePMI(inputs) {
  if (!inputs.length) return 1000;

  const totalWeight = inputs.reduce((sum, i) => sum + i.weight, 0);

  const weighted = inputs.reduce((sum, { currentPrice, baselinePrice, weight }) => {
    if (!baselinePrice || baselinePrice === 0) return sum;
    return sum + (currentPrice / baselinePrice) * weight;
  }, 0);

  // Normalise in case not all cards have baselines yet
  const normalised = totalWeight > 0 ? weighted / totalWeight : weighted;

  return Math.round(normalised * 1000 * 100) / 100;
}

/**
 * Compute percent change between two PMI values.
 *
 * @param {number} current
 * @param {number} previous
 * @returns {number} percent change rounded to 2 decimal places
 */
export function computeChangePct(current, previous) {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}
