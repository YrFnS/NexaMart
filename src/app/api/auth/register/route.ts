import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  attachSessionCookie,
  createSessionToken,
  hashPassword,
  passwordCredentialKey,
  toPublicUser,
} from '@/lib/auth';
import { checkApiRateLimit, RATE_LIMITS, validateCsrf } from '@/lib/security';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.auth);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 254).toLowerCase();
    const phone = cleanText(body.phone, 30);
    const password = String(body.password ?? '');

    if (name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 });
    }
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: 'Password must be between 8 and 128 characters.' },
        { status: 400 },
      );
    }

    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          name,
          phone: phone || null,
          role: 'buyer',
          loyaltyTier: 'bronze',
          loyaltyPoints: 0,
          walletBalance: 0,
          aiCredits: 10,
          isVerified: false,
        },
      });

      await tx.platformSettings.create({
        data: {
          key: passwordCredentialKey(created.id),
          value: passwordHash,
        },
      });

      return created;
    });

    const publicUser = toPublicUser(user);
    const response = NextResponse.json({ user: publicUser }, { status: 201 });
    response.headers.set('Cache-Control', 'no-store');
    return attachSessionCookie(response, createSessionToken(publicUser));
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';
    if (code === 'P2002') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
