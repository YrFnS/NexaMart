import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { toAuthenticatedUser } from '@/lib/auth';
import { checkDistributedApiRateLimit } from '@/lib/api-rate-limit';
import { hashPassword } from '@/lib/password';
import { RATE_LIMITS, validateCsrf } from '@/lib/security';
import {
  createSessionToken,
  serializeSessionCookie,
  type SessionRole,
} from '@/lib/session';

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const rateLimit = await checkDistributedApiRateLimit(
    request,
    'auth:register',
    RATE_LIMITS.auth,
  );
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin' }, { status: 403 });
  }

  try {
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check the registration details and try again.' },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const passwordHash = await hashPassword(parsed.data.password);

    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        phone: parsed.data.phone || null,
        passwordHash,
        role: 'buyer',
        loyaltyTier: 'bronze',
        loyaltyPoints: 0,
        walletBalance: 0,
        aiCredits: 5,
      },
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
      },
    });

    const publicUser = toAuthenticatedUser(user);
    const token = createSessionToken({
      id: user.id,
      role: user.role as SessionRole,
    });

    const response = NextResponse.json({ user: publicUser }, { status: 201 });
    response.headers.set('Set-Cookie', serializeSessionCookie(token));
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 },
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
