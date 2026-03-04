export async function GET() {
  const raw = process.env.PREMIUM_KEYS ?? '(not set)';
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);

  return Response.json({
    raw_length: raw.length,
    raw_preview: raw.substring(0, 50) + (raw.length > 50 ? '...' : ''),
    keys_count: keys.length,
    keys_preview: keys.map(k => k.substring(0, 8) + '...'),
  });
}
