import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const SESSION_COOKIE_NAME = 'nexamart_session';
const USER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const ADMIN_SESSION_TTL_SECONDS = 60 * 30;
const PASSWORD_PREFIX = 'scrypt';

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  loyaltyTier: string;
  loyaltyPoints: number;
  walletBalance: number;
  aiCredits: number;
  isVerified: boolean;
}

export interface SessionClaims {
  sub: string;
  role: UserRole;
  exp: number;
  ver: 1;
}

export type AuthenticationResult =
  | { user: PublicUser; response: null }
  | { user: null; response: NextResponse };

type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  loyaltyTier: string;
  loyaltyPoints: number;
  walletBalance: number;
  aiCredits: number;
  isVerified: boolean;
  isBanned: boolean;
};

function normalizeRole(role: string): UserRole {
  if (role === 'seller' || role === 'admin') return role;
  return 'buyer';
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';
  if (secret.length < 32) {
    throw new Error('AUTH_SECRET or NEXTAUTH_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

function getSessionTtl(role: UserRole): number {
  return role === 'admin' ? ADMIN_SESSION_TTL_SECONDS : USER_SESSION_TTL_SECONDS;
}

function sign(encodedPayload: string): string {
  return createHmac('sha256', getAuthSecret()).update(encodedPayload).digest('base64url');
}

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce<Record<string, string>>((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return cookies;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

export function createSessionToken(user: Pick<PublicUser, 'id' | 'role'>): string {
  const claims: SessionClaims = {
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + getSessionTtl(user.role),
    ver: 1,
  };
  const encodedPayload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token: string): SessionClaims | null {
  try {
    const [encodedPayload, providedSignature, extra] = token.split('.');
    if (!encodedPayload || !providedSignature || extra) return null;

    const expectedSignature = Buffer.from(sign(encodedPayload), 'base64url');
    const receivedSignature = Buffer.from(providedSignature, 'base64url');
    if (
      expectedSignature.length !== receivedSignature.length ||
      !timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return null;
    }

    const claims = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as Partial<SessionClaims>;

    if (
      !claims.sub ||
      claims.ver !== 1 ||
      typeof claims.exp !== 'number' ||
      claims.exp <= Math.floor(Date.now() / 1000) ||
      !['buyer', 'seller', 'admin'].includes(String(claims.role))
    ) {
      return null;
    }

    return claims as SessionClaims;
  } catch {
    return null;
  }
}

export function getSessionClaims(request: Request): SessionClaims | null {
  const token = parseCookieHeader(request.headers.get('cookie'))[SESSION_COOKIE_NAME];
  return token ? verifySessionToken(token) : null;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split('@')[0],
    phone: user.phone || undefined,
    avatar: user.avatar || undefined,
    role: normalizeRole(user.role),
    loyaltyTier: user.loyaltyTier,
    loyaltyPoints: user.loyaltyPoints,
    walletBalance: Number(user.walletBalance),
    aiCredits: user.aiCredits,
    isVerified: user.isVerified,
  };
}

export async function getCurrentUser(request: Request): Promise<PublicUser | null> {
  const claims = getSessionClaims(request);
  if (!claims) return null;

  const user = await db.user.findUnique({
    where: { id: claims.sub },
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

  if (!user || user.isBanned) return null;
  return toPublicUser(user);
}

export async function requireAuthenticatedUser(
  request: Request,
): Promise<AuthenticationResult> {
  const user = await getCurrentUser(request);
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
  return { user, response: null };
}

export async function requireRole(
  request: Request,
  roles: UserRole[],
): Promise<AuthenticationResult> {
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth;
  if (!roles.includes(auth.user.role)) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return auth;
}

export function attachSessionCookie(response: NextResponse, token: string): NextResponse {
  const claims = verifySessionToken(token);
  const maxAge = claims ? Math.max(0, claims.exp - Math.floor(Date.now() / 1000)) : 0;
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${PASSWORD_PREFIX}$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [prefix, salt, expectedHex, extra] = storedHash.split('$');
    if (prefix !== PASSWORD_PREFIX || !salt || !expectedHex || extra) return false;
    const expected = Buffer.from(expectedHex, 'hex');
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function passwordCredentialKey(userId: string): string {
  return `auth.password.${userId}`;
}
