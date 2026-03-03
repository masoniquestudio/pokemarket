import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const count = await sql`SELECT COUNT(*) FROM price_snapshots`;
    const distinct = await sql`SELECT DISTINCT card_id FROM price_snapshots`;
    const sample = await sql`SELECT card_id, price_avg, recorded_at FROM price_snapshots ORDER BY recorded_at DESC LIMIT 5`;
    const latest = await sql`
      SELECT DISTINCT ON (card_id) card_id, price_avg, recorded_at
      FROM price_snapshots
      ORDER BY card_id, recorded_at DESC
    `;

    return Response.json({
      totalRows: count.rows[0].count,
      distinctCards: distinct.rows.map(r => r.card_id),
      recentRows: sample.rows,
      latestPerCard: latest.rows.length,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
