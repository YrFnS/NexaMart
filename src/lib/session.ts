import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'nexamart_session';
export const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionRole = 'buyer' | 'seller' | 'admin';

export interface SessionClaims {
  sub: string;
  role: SessionRole;
  iat: number;
  exp: number;
}

function getSessionSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (secret) {
    if (process.env.NODE_ENV === 'production' && secret.length < 32) {
      throw new Error('AUTH_SECRET must contain at least 32 characters in production.');
    }
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required in production.');
  }

  return 'nexamart-development-session-secret-change-me';
}

function sign(value: string): string {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

export function createSessionToken(
  user: { id: string; role: SessionRole },
  ttlSeconds = Number(process.env.AUTH_SESSION_TTL_SECONDS) || DEFAULT_SESSION_TTL_SECONDS,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionClaims = {
    sub: user.id,
    role: user.role,
    iat: now,
    exp: now + Math.max(300, ttlSeconds),
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token: string | null | undefined): SessionClaims | null {
  if (!token) return null;

  const [encodedPayload, providedSignature, extra] = token.split('.');
  if (!encodedPayload || !providedSignature || extra) return null;

  try {
    const expectedSignature = sign(encodedPayload);
    const expected = Buffer.from(expectedSignature, 'utf8');
    const provided = Buffer.from(providedSignature, 'utf8');

    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
      return null;
    }

    const claims = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as SessionClaims;

    if (
      !claims.sub ||
      !['buyer', 'seller', 'admin'].includes(claims.role) ||
      !Number.isInteger(claims.iat) ||
      !Number.isInteger(claims.exp) ||
      claims.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;

    const key = part.slice(0, separator).trim();
    if (key !== name) continue;

    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }

  return null;
}

export function getSessionClaims(request: Request): SessionClaims | null {
  const token = readCookie(request.headers.get('cookie'), SESSION_COOKIE_NAME);
  return verifySessionToken(token);
}

export function serializeSessionCookie(
  token: string,
  maxAgeSeconds = DEFAULT_SESSION_TTL_SECONDS,
): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, maxAgeSeconds)}${secure}`;
}

export function serializeExpiredSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
