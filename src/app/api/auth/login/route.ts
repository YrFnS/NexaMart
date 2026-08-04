import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  attachSessionCookie,
  createSessionToken,
  passwordCredentialKey,
  toPublicUser,
  verifyPassword,
} from '@/lib/auth';
import { checkApiRateLimit, RATE_LIMITS, validateCsrf } from '@/lib/security';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.auth);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 254);
    const password = String(body.password ?? '');

    if (!EMAIL_PATTERN.test(email) || !password) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || user.isBanned) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const credential = await db.platformSettings.findUnique({
      where: { key: passwordCredentialKey(user.id) },
      select: { value: true },
    });

    if (!credential || !verifyPassword(password, credential.value)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const publicUser = toPublicUser(user);
    const response = NextResponse.json({ user: publicUser });
    response.headers.set('Cache-Control', 'no-store');
    return attachSessionCookie(response, createSessionToken(publicUser));
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
