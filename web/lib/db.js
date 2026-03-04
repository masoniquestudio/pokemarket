import { sql } from '@vercel/postgres';

/**
 * Create tables if they don't exist.
 * Call this once on first deploy (or via /api/setup).
 */
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS price_snapshots (
      id          SERIAL PRIMARY KEY,
      card_id     TEXT NOT NULL,
      price_avg   NUMERIC NOT NULL,
      price_low   NUMERIC,
      price_high  NUMERIC,
      volume      INTEGER,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS index_snapshots (
      id          SERIAL PRIMARY KEY,
      value       NUMERIC NOT NULL,
      change_pct  NUMERIC,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_price_snapshots_card_id
      ON price_snapshots (card_id, recorded_at DESC);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_index_snapshots_recorded_at
      ON index_snapshots (recorded_at DESC);
  `;

  // Add index_id column to index_snapshots if it doesn't exist (migration)
  await sql`
    ALTER TABLE index_snapshots
    ADD COLUMN IF NOT EXISTS index_id TEXT NOT NULL DEFAULT 'pmi'
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_index_snapshots_index_id
      ON index_snapshots (index_id, recorded_at DESC)
  `;
}

/**
 * Insert a price snapshot for a single card.
 */
export async function insertPriceSnapshot({ cardId, priceAvg, priceLow, priceHigh, volume }) {
  await sql`
    INSERT INTO price_snapshots (card_id, price_avg, price_low, price_high, volume)
    VALUES (${cardId}, ${priceAvg}, ${priceLow}, ${priceHigh}, ${volume})
  `;
}

/**
 * Get the latest price snapshot for every card.
 * Returns one row per card_id (the most recent).
 */
export async function getLatestPrices() {
  const { rows } = await sql`
    SELECT DISTINCT ON (card_id)
      card_id, price_avg, price_low, price_high, volume, recorded_at
    FROM price_snapshots
    ORDER BY card_id, recorded_at DESC
  `;
  return rows;
}

/**
 * Get price history for a single card over the last N days.
 */
export async function getPriceHistory(cardId, days = 30) {
  const { rows } = await sql`
    SELECT card_id, price_avg, price_low, price_high, volume, recorded_at
    FROM price_snapshots
    WHERE card_id = ${cardId}
      AND recorded_at >= NOW() - (${days} || ' days')::INTERVAL
    ORDER BY recorded_at ASC
  `;
  return rows;
}

/**
 * Get the very first recorded price for a card (used as PMI baseline).
 */
export async function getBaselinePrice(cardId) {
  const { rows } = await sql`
    SELECT price_avg, recorded_at
    FROM price_snapshots
    WHERE card_id = ${cardId}
    ORDER BY recorded_at ASC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Insert a computed index snapshot for a named index.
 */
export async function insertIndexSnapshot({ indexId = 'pmi', value, changePct }) {
  await sql`
    INSERT INTO index_snapshots (index_id, value, change_pct)
    VALUES (${indexId}, ${value}, ${changePct})
  `;
}

/**
 * Get index history for a specific named index over the last N days.
 */
export async function getIndexHistory(days = 30, indexId = 'pmi') {
  const { rows } = await sql`
    SELECT value, change_pct, recorded_at
    FROM index_snapshots
    WHERE index_id = ${indexId}
      AND recorded_at >= NOW() - (${days} || ' days')::INTERVAL
    ORDER BY recorded_at ASC
  `;
  return rows;
}

/**
 * Get the latest snapshot for a specific named index.
 */
export async function getLatestIndex(indexId = 'pmi') {
  const { rows } = await sql`
    SELECT value, change_pct, recorded_at
    FROM index_snapshots
    WHERE index_id = ${indexId}
    ORDER BY recorded_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Get the index value from ~7 days ago for change % calculation.
 */
export async function getIndex7DaysAgo(indexId = 'pmi') {
  const { rows } = await sql`
    SELECT value, recorded_at
    FROM index_snapshots
    WHERE index_id = ${indexId}
      AND recorded_at <= NOW() - INTERVAL '7 days'
    ORDER BY recorded_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Get the latest snapshot for ALL named indices in one query.
 * Returns an object keyed by index_id.
 */
export async function getAllLatestIndices() {
  const { rows } = await sql`
    SELECT DISTINCT ON (index_id)
      index_id, value, change_pct, recorded_at
    FROM index_snapshots
    ORDER BY index_id, recorded_at DESC
  `;
  return Object.fromEntries(rows.map((r) => [r.index_id, r]));
}

/**
 * Get history for all indices over the last N days.
 * Returns an object keyed by index_id, each value is an array of {time, value}.
 */
export async function getAllIndexHistories(days = 30) {
  const { rows } = await sql`
    SELECT index_id, value, recorded_at
    FROM index_snapshots
    WHERE recorded_at >= NOW() - (${days} || ' days')::INTERVAL
    ORDER BY index_id, recorded_at ASC
  `;
  const result = {};
  for (const row of rows) {
    if (!result[row.index_id]) result[row.index_id] = [];
    result[row.index_id].push({
      time: new Date(row.recorded_at).toISOString(),
      value: parseFloat(String(row.value)),
    });
  }
  return result;
}

/**
 * Get latest price + 7-day-ago price for every card.
 * Compares current price to the closest snapshot from ~7 days ago.
 */
export async function getCardPriceChanges() {
  const { rows } = await sql`
    WITH latest AS (
      SELECT DISTINCT ON (card_id)
        card_id, price_avg, price_low, price_high, volume, recorded_at
      FROM price_snapshots
      ORDER BY card_id, recorded_at DESC
    ),
    seven_days_ago AS (
      SELECT DISTINCT ON (card_id)
        card_id, price_avg AS prev_price
      FROM price_snapshots
      WHERE recorded_at <= NOW() - INTERVAL '7 days'
      ORDER BY card_id, recorded_at DESC
    )
    SELECT
      l.card_id, l.price_avg, l.price_low, l.price_high, l.volume, l.recorded_at,
      s.prev_price
    FROM latest l
    LEFT JOIN seven_days_ago s ON l.card_id = s.card_id
  `;
  return rows;
}

/**
 * Get price history for all cards over the last N days.
 * Used to build per-sector sparklines.
 */
export async function getAllPriceHistory(days = 30) {
  const { rows } = await sql`
    SELECT card_id, price_avg, recorded_at
    FROM price_snapshots
    WHERE recorded_at >= NOW() - (${days} || ' days')::INTERVAL
    ORDER BY card_id, recorded_at ASC
  `;
  return rows;
}

// ─── PREMIUM QUERIES ───────────────────────────────────────────────────────────

/**
 * Get prices from 1D, 7D, 30D, 90D ago for all cards in a single query.
 * Used for multi-timeframe premium analytics.
 */
export async function getCardPriceChangesMultiPeriod() {
  const { rows } = await sql`
    WITH latest AS (
      SELECT DISTINCT ON (card_id)
        card_id, price_avg, price_low, price_high, volume, recorded_at
      FROM price_snapshots
      ORDER BY card_id, recorded_at DESC
    ),
    one_day_ago AS (
      SELECT DISTINCT ON (card_id)
        card_id, price_avg AS price_1d
      FROM price_snapshots
      WHERE recorded_at <= NOW() - INTERVAL '1 day'
      ORDER BY card_id, recorded_at DESC
    ),
    seven_days_ago AS (
      SELECT DISTINCT ON (card_id)
        card_id, price_avg AS price_7d
      FROM price_snapshots
      WHERE recorded_at <= NOW() - INTERVAL '7 days'
      ORDER BY card_id, recorded_at DESC
    ),
    thirty_days_ago AS (
      SELECT DISTINCT ON (card_id)
        card_id, price_avg AS price_30d
      FROM price_snapshots
      WHERE recorded_at <= NOW() - INTERVAL '30 days'
      ORDER BY card_id, recorded_at DESC
    ),
    ninety_days_ago AS (
      SELECT DISTINCT ON (card_id)
        card_id, price_avg AS price_90d
      FROM price_snapshots
      WHERE recorded_at <= NOW() - INTERVAL '90 days'
      ORDER BY card_id, recorded_at DESC
    )
    SELECT
      l.card_id, l.price_avg, l.price_low, l.price_high, l.volume, l.recorded_at,
      d1.price_1d, d7.price_7d, d30.price_30d, d90.price_90d
    FROM latest l
    LEFT JOIN one_day_ago d1 ON l.card_id = d1.card_id
    LEFT JOIN seven_days_ago d7 ON l.card_id = d7.card_id
    LEFT JOIN thirty_days_ago d30 ON l.card_id = d30.card_id
    LEFT JOIN ninety_days_ago d90 ON l.card_id = d90.card_id
  `;
  return rows;
}

/**
 * Get 7-day and 30-day moving averages + stddev for Buy Low signal calculation.
 */
export async function getCardMovingAverages() {
  const { rows } = await sql`
    WITH daily_prices AS (
      SELECT DISTINCT ON (card_id, date_trunc('day', recorded_at))
        card_id,
        price_avg,
        recorded_at
      FROM price_snapshots
      WHERE recorded_at >= NOW() - INTERVAL '30 days'
      ORDER BY card_id, date_trunc('day', recorded_at), recorded_at DESC
    ),
    latest AS (
      SELECT DISTINCT ON (card_id)
        card_id, price_avg AS current_price, volume
      FROM price_snapshots
      ORDER BY card_id, recorded_at DESC
    ),
    ma_7d AS (
      SELECT
        card_id,
        AVG(price_avg) AS sma_7d,
        STDDEV(price_avg) AS stddev_7d
      FROM daily_prices
      WHERE recorded_at >= NOW() - INTERVAL '7 days'
      GROUP BY card_id
    ),
    ma_30d AS (
      SELECT
        card_id,
        AVG(price_avg) AS sma_30d,
        STDDEV(price_avg) AS stddev_30d
      FROM daily_prices
      GROUP BY card_id
    )
    SELECT
      l.card_id, l.current_price, l.volume,
      m7.sma_7d, m7.stddev_7d,
      m30.sma_30d, m30.stddev_30d
    FROM latest l
    LEFT JOIN ma_7d m7 ON l.card_id = m7.card_id
    LEFT JOIN ma_30d m30 ON l.card_id = m30.card_id
  `;
  return rows;
}

/**
 * Get index values from multiple time periods for a specific index.
 */
export async function getIndexChangesMultiPeriod(indexId = 'pmi') {
  const { rows } = await sql`
    WITH latest AS (
      SELECT value, recorded_at
      FROM index_snapshots
      WHERE index_id = ${indexId}
      ORDER BY recorded_at DESC
      LIMIT 1
    ),
    periods AS (
      SELECT
        (SELECT value FROM index_snapshots
         WHERE index_id = ${indexId} AND recorded_at <= NOW() - INTERVAL '1 day'
         ORDER BY recorded_at DESC LIMIT 1) AS value_1d,
        (SELECT value FROM index_snapshots
         WHERE index_id = ${indexId} AND recorded_at <= NOW() - INTERVAL '7 days'
         ORDER BY recorded_at DESC LIMIT 1) AS value_7d,
        (SELECT value FROM index_snapshots
         WHERE index_id = ${indexId} AND recorded_at <= NOW() - INTERVAL '30 days'
         ORDER BY recorded_at DESC LIMIT 1) AS value_30d,
        (SELECT value FROM index_snapshots
         WHERE index_id = ${indexId} AND recorded_at <= NOW() - INTERVAL '90 days'
         ORDER BY recorded_at DESC LIMIT 1) AS value_90d
    )
    SELECT l.value AS current_value, l.recorded_at, p.*
    FROM latest l, periods p
  `;
  return rows[0] ?? null;
}
