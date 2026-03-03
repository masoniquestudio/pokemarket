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
 * Insert a computed PMI index snapshot.
 */
export async function insertIndexSnapshot({ value, changePct }) {
  await sql`
    INSERT INTO index_snapshots (value, change_pct)
    VALUES (${value}, ${changePct})
  `;
}

/**
 * Get index history for the last N days.
 */
export async function getIndexHistory(days = 30) {
  const { rows } = await sql`
    SELECT value, change_pct, recorded_at
    FROM index_snapshots
    WHERE recorded_at >= NOW() - (${days} || ' days')::INTERVAL
    ORDER BY recorded_at ASC
  `;
  return rows;
}

/**
 * Get the latest index snapshot.
 */
export async function getLatestIndex() {
  const { rows } = await sql`
    SELECT value, change_pct, recorded_at
    FROM index_snapshots
    ORDER BY recorded_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Get latest price + price from ~7 days ago for every card.
 * Used to compute per-card % change on the homepage.
 */
export async function getCardPriceChanges() {
  const { rows } = await sql`
    WITH latest AS (
      SELECT DISTINCT ON (card_id)
        card_id, price_avg, price_low, price_high, volume, recorded_at
      FROM price_snapshots
      ORDER BY card_id, recorded_at DESC
    ),
    week_ago AS (
      SELECT DISTINCT ON (card_id)
        card_id, price_avg AS prev_price
      FROM price_snapshots
      WHERE recorded_at <= NOW() - INTERVAL '7 days'
      ORDER BY card_id, recorded_at DESC
    )
    SELECT l.*, w.prev_price
    FROM latest l
    LEFT JOIN week_ago w ON l.card_id = w.card_id
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
