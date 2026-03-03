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
 * Get latest price + previous price for every card.
 * Uses the snapshot immediately before the latest one, so changes show
 * up as soon as there are 2 scrape runs (no 7-day wait required).
 */
export async function getCardPriceChanges() {
  const { rows } = await sql`
    WITH ranked AS (
      SELECT
        card_id, price_avg, price_low, price_high, volume, recorded_at,
        ROW_NUMBER() OVER (PARTITION BY card_id ORDER BY recorded_at DESC) AS rn
      FROM price_snapshots
    ),
    latest AS (SELECT * FROM ranked WHERE rn = 1),
    prev   AS (SELECT card_id, price_avg AS prev_price FROM ranked WHERE rn = 2)
    SELECT
      l.card_id, l.price_avg, l.price_low, l.price_high, l.volume, l.recorded_at,
      p.prev_price
    FROM latest l
    LEFT JOIN prev p ON l.card_id = p.card_id
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
