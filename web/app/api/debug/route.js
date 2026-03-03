import { sql } from '@vercel/postgres';
import { CARDS } from '../../../lib/cards';

export async function GET() {
  try {
    const baselines = [];
    for (const card of CARDS) {
      const { rows } = await sql`
        SELECT price_avg, recorded_at
        FROM price_snapshots
        WHERE card_id = ${card.id}
        ORDER BY recorded_at ASC
        LIMIT 1
      `;
      baselines.push({ cardId: card.id, baseline: rows[0] ?? null });
    }

    const missing = baselines.filter(b => !b.baseline).map(b => b.cardId);
    const found = baselines.filter(b => b.baseline).length;

    return Response.json({ found, missing, baselines });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
