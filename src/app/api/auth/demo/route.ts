import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  attachSessionCookie,
  createSessionToken,
  toPublicUser,
} from '@/lib/auth';
import { checkApiRateLimit, RATE_LIMITS, validateCsrf } from '@/lib/security';

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.auth);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin' }, { status: 403 });
  }

  const demoEnabled =
    process.env.ALLOW_DEMO_LOGIN === 'true' || process.env.NODE_ENV !== 'production';
  if (!demoEnabled) {
    return NextResponse.json({ error: 'Demo login is disabled.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const role = body.role === 'seller' ? 'seller' : 'buyer';
    const email = role === 'seller' ? 'seller@nexamart.com' : 'demo@nexamart.com';
    const user = await db.user.findUnique({ where: { email } });

    if (!user || user.isBanned) {
      return NextResponse.json(
        { error: 'Demo user not found. Seed the database first.' },
        { status: 404 },
      );
    }

    const publicUser = toPublicUser(user);
    const response = NextResponse.json({ user: publicUser });
    response.headers.set('Cache-Control', 'no-store');
    return attachSessionCookie(response, createSessionToken(publicUser));
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json({ error: 'Demo login failed.' }, { status: 500 });
  }
}
