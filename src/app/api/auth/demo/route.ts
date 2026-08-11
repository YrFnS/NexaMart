import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { toAuthenticatedUser } from '@/lib/auth';
import { isDemoLoginEnabled } from '@/lib/demo-login';
import { checkApiRateLimit, RATE_LIMITS, validateCsrf } from '@/lib/security';
import {
  createSessionToken,
  serializeSessionCookie,
  type SessionRole,
} from '@/lib/session';

const demoSchema = z.object({
  role: z.enum(['buyer', 'seller']).default('buyer'),
});

export async function POST(request: Request) {
  if (!isDemoLoginEnabled()) {
    return NextResponse.json({ error: 'Demo login is disabled.' }, { status: 404 });
  }

  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.auth);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = demoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid demo role.' }, { status: 400 });
    }

    const email = parsed.data.role === 'seller' ? 'seller@nexamart.com' : 'demo@nexamart.com';
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        loyaltyTier: true,
        loyaltyPoints: true,
        walletBalance: true,
        aiCredits: true,
        isVerified: true,
        isBanned: true,
      },
    });

    if (!user || user.isBanned) {
      return NextResponse.json(
        { error: 'Demo user not found. Seed the database first.' },
        { status: 404 },
      );
    }

    const token = createSessionToken({
      id: user.id,
      role: user.role as SessionRole,
    });
    const response = NextResponse.json({ user: toAuthenticatedUser(user) });
    response.headers.set('Set-Cookie', serializeSessionCookie(token));
    return response;
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json({ error: 'Demo login failed.' }, { status: 500 });
  }
}
