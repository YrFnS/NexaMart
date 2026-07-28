import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { toAuthenticatedUser } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
} from '@/lib/security';
import {
  createSessionToken,
  serializeSessionCookie,
  type SessionRole,
} from '@/lib/session';

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.auth);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin' }, { status: 403 });
  }

  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
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
        passwordHash: true,
      },
    });

    const isValid = Boolean(
      user?.passwordHash &&
      !user.isBanned &&
      (await verifyPassword(parsed.data.password, user.passwordHash)),
    );

    if (!user || !isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const publicUser = toAuthenticatedUser(user);
    const token = createSessionToken({
      id: user.id,
      role: user.role as SessionRole,
    });

    const response = NextResponse.json({ user: publicUser });
    response.headers.set('Set-Cookie', serializeSessionCookie(token));
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
