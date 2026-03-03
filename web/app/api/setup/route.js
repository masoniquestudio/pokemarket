import { initDb } from '../../../lib/db';

export async function GET() {
  try {
    await initDb();
    return Response.json({ ok: true, message: 'Tables created (or already exist).' });
  } catch (err) {
    console.error('DB setup error:', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
