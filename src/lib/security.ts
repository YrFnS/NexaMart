/**
 * NexaMart server security utilities.
 */

import { NextResponse } from 'next/server';
import { getSessionClaims } from '@/lib/auth';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
let lastRateLimitCleanup = 0;

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  general: { maxRequests: 60, windowSeconds: 60 },
  admin: { maxRequests: 30, windowSeconds: 60 },
  auth: { maxRequests: 5, windowSeconds: 60 },
  write: { maxRequests: 20, windowSeconds: 60 },
  seed: { maxRequests: 3, windowSeconds: 300 },
  search: { maxRequests: 30, windowSeconds: 60 },
} as const;

function cleanupRateLimits(now: number) {
  if (now - lastRateLimitCleanup < 5 * 60 * 1000) return;
  lastRateLimitCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) rateLimitStore.delete(key);
  }
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  cleanupRateLimits(now);

  const key = `${identifier}:${config.windowSeconds}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    const nextEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowSeconds * 1000,
    };
    rateLimitStore.set(key, nextEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: nextEntry.resetTime,
    };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetTime };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetTime,
  };
}

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || '';
const ALLOW_LEGACY_ADMIN_KEY = process.env.ALLOW_LEGACY_ADMIN_KEY === 'true';

export function validateAdminAuth(
  request: Request,
): { authorized: boolean; error?: string; status?: 401 | 403 } {
  const claims = getSessionClaims(request);
  if (claims?.role === 'admin') return { authorized: true };
  if (claims) {
    return { authorized: false, error: 'Admin role required.', status: 403 };
  }

  // Legacy shared-key access is disabled by default and must be explicitly
  // enabled for a temporary migration window.
  if (ALLOW_LEGACY_ADMIN_KEY && ADMIN_SECRET) {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const headerKey = request.headers.get('x-admin-key') || '';
    if (bearer === ADMIN_SECRET || headerKey === ADMIN_SECRET) {
      return { authorized: true };
    }
  }

  return {
    authorized: false,
    error: 'An authenticated admin session is required.',
    status: 401,
  };
}

export function requireAdminAuth(request: Request): NextResponse | null {
  const auth = validateAdminAuth(request);
  if (auth.authorized) return null;
  return NextResponse.json(
    { error: auth.status === 403 ? 'Forbidden' : 'Unauthorized', message: auth.error },
    { status: auth.status || 401 },
  );
}

export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function validatePagination(
  page: unknown,
  limit: unknown,
  maxLimit = 100,
): { page: number; limit: number } {
  const parsedPage = Math.max(1, parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(String(limit), 10) || 20));
  return { page: parsedPage, limit: parsedLimit };
}

export function isValidId(id: string): boolean {
  const cuidRegex = /^[a-z0-9]{8,30}$/;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const customIdRegex = /^[A-Z]{2,4}-\d{2,4}$/;
  return cuidRegex.test(id) || uuidRegex.test(id) || customIdRegex.test(id);
}

export function validateSearchParam(search: string, maxLength = 200): string {
  const value = search.slice(0, maxLength);
  return value
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .trim();
}

export function validateEnum<T extends string>(value: string, allowed: T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

export function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(getSecurityHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

export function secureJsonResponse(
  data: unknown,
  options: {
    status?: number;
    rateLimit?: { remaining: number; resetAt: number };
  } = {},
): NextResponse {
  const response = NextResponse.json(data, { status: options.status ?? 200 });
  withSecurityHeaders(response);

  if (options.rateLimit) {
    response.headers.set('X-RateLimit-Remaining', String(options.rateLimit.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(options.rateLimit.resetAt / 1000)));
  }
  return response;
}

export function rateLimitResponse(resetAt: number): NextResponse {
  const response = NextResponse.json(
    { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' },
    { status: 429 },
  );
  response.headers.set('Retry-After', String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  return response;
}

export function checkApiRateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.general,
): { allowed: boolean; remaining: number; resetAt: number; response?: NextResponse } {
  const result = checkRateLimit(getClientIdentifier(request), config);
  if (!result.allowed) return { ...result, response: rateLimitResponse(result.resetAt) };
  return result;
}

export function validateAdminRequest(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.admin,
): NextResponse | null {
  const rateResult = checkApiRateLimit(request, config);
  if (!rateResult.allowed && rateResult.response) return rateResult.response;
  return requireAdminAuth(request);
}

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function validateCsrf(request: Request): { valid: boolean; error?: string } {
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return { valid: true };

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  if (!origin && !referer) return { valid: true };

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : undefined,
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeOrigin)
    .filter((value): value is string => Boolean(value));

  const requestOrigin = origin ? normalizeOrigin(origin) : referer ? normalizeOrigin(referer) : null;
  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    return { valid: false, error: 'Invalid request origin.' };
  }

  return { valid: true };
}
