import { cookies } from 'next/headers';
import { validatePremiumKey, PREMIUM_COOKIE_NAME } from '@/lib/premium-gate';

export async function POST(request: Request) {
  try {
    const { key } = await request.json();

    if (!key || typeof key !== 'string') {
      return Response.json({ ok: false, error: 'Missing key' }, { status: 400 });
    }

    if (validatePremiumKey(key)) {
      const cookieStore = await cookies();
      cookieStore.set(PREMIUM_COOKIE_NAME, key.trim(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: 'Invalid key' }, { status: 401 });
  } catch {
    return Response.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
