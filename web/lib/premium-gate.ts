import { cookies } from 'next/headers';

const PREMIUM_KEYS = new Set(
  (process.env.PREMIUM_KEYS ?? '').split(',').map((k) => k.trim()).filter(Boolean)
);

/**
 * Check if the current user has premium access.
 * Call this in Server Components.
 */
export async function isPremiumUser(): Promise<boolean> {
  const cookieStore = await cookies();
  const key = cookieStore.get('premium_key')?.value;
  return key ? PREMIUM_KEYS.has(key) : false;
}

/**
 * Validate a premium key.
 */
export function validatePremiumKey(key: string): boolean {
  return PREMIUM_KEYS.has(key.trim());
}

/**
 * Get the premium cookie name for client-side checks.
 */
export const PREMIUM_COOKIE_NAME = 'premium_key';
