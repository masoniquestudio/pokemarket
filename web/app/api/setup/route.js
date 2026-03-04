import { initDb } from '../../../lib/db';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    await initDb();
    return Response.json({
      ok: true,
      message: 'Tables created (or already exist).',
      env: {
        POKEWALLET_API_KEY: process.env.POKEWALLET_API_KEY ? `set (${process.env.POKEWALLET_API_KEY.slice(0, 10)}...)` : 'NOT SET',
      },
    });
  } catch (err) {
    console.error('DB setup error:', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    await sql`TRUNCATE TABLE price_snapshots, index_snapshots RESTART IDENTITY;`;
    return Response.json({ ok: true, message: 'price_snapshots and index_snapshots cleared.' });
  } catch (err) {
    console.error('DB reset error:', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
