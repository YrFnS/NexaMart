import { NextResponse } from 'next/server';
import { getSessionClaims } from '@/lib/session';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const rateLimitCleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);
rateLimitCleanup.unref?.();

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

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `${identifier}:${config.maxRequests}:${config.windowSeconds}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowSeconds * 1000;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - 1),
      resetAt: resetTime,
    };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetTime };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - entry.count),
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

function hasValidServerBearer(request: Request): boolean {
  const configuredSecret = process.env.ADMIN_SECRET_KEY;
  if (!configuredSecret) return false;

  const authorization = request.headers.get('authorization');
  return authorization === `Bearer ${configuredSecret}`;
}

export function validateAdminAuth(request: Request): {
  authorized: boolean;
  error?: string;
} {
  const session = getSessionClaims(request);
  if (session?.role === 'admin') return { authorized: true };

  // This fallback is only for trusted server-to-server automation. The secret
  // must never use a NEXT_PUBLIC_ environment variable or browser storage.
  if (hasValidServerBearer(request)) return { authorized: true };

  return {
    authorized: false,
    error: 'An authenticated administrator session is required.',
  };
}

export function requireAdminAuth(request: Request): NextResponse | null {
  const auth = validateAdminAuth(request);
  if (auth.authorized) return null;

  return NextResponse.json(
    { error: 'Unauthorized', message: auth.error },
    { status: 401 },
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
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(
    maxLimit,
    Math.max(1, Number.parseInt(String(limit), 10) || 20),
  );
  return { page: parsedPage, limit: parsedLimit };
}

export function isValidId(id: string): boolean {
  const cuidRegex = /^[a-z0-9]{8,30}$/;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const customIdRegex = /^[A-Z]{2,4}-\d{2,4}$/;
  return cuidRegex.test(id) || uuidRegex.test(id) || customIdRegex.test(id);
}

export function validateSearchParam(search: string, maxLength = 200): string {
  return search
    .slice(0, maxLength)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .trim();
}

export function validateEnum<T extends string>(
  value: string,
  allowed: readonly T[],
): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

export function getSecurityHeaders(): Record<string, string> {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const scriptPolicy = isDevelopment
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline'";

  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'Content-Security-Policy': [
      "default-src 'self'",
      scriptPolicy,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
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
  const response = withSecurityHeaders(
    NextResponse.json(data, { status: options.status ?? 200 }),
  );

  if (options.rateLimit) {
    response.headers.set(
      'X-RateLimit-Remaining',
      String(options.rateLimit.remaining),
    );
    response.headers.set(
      'X-RateLimit-Reset',
      String(Math.ceil(options.rateLimit.resetAt / 1000)),
    );
  }

  return response;
}

export function rateLimitResponse(resetAt: number): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    },
    { status: 429 },
  );
  response.headers.set(
    'Retry-After',
    String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))),
  );
  response.headers.set(
    'X-RateLimit-Reset',
    String(Math.ceil(resetAt / 1000)),
  );
  return response;
}

export function checkApiRateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.general,
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  response?: NextResponse;
} {
  const result = checkRateLimit(getClientIdentifier(request), config);
  if (!result.allowed) {
    return { ...result, response: rateLimitResponse(result.resetAt) };
  }
  return result;
}

export function validateAdminRequest(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.admin,
): NextResponse | null {
  const rateResult = checkApiRateLimit(request, config);
  if (!rateResult.allowed && rateResult.response) return rateResult.response;

  const authResponse = requireAdminAuth(request);
  if (authResponse) return authResponse;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin' },
      { status: 403 },
    );
  }

  return null;
}

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function allowedOrigins(): Set<string> {
  const values = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : undefined,
  ];

  return new Set(
    values
      .filter((value): value is string => Boolean(value))
      .map(normalizeOrigin)
      .filter((value): value is string => Boolean(value)),
  );
}

export function validateCsrf(request: Request): { valid: boolean; error?: string } {
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return { valid: true };
  }

  // Signed-cookie requests must originate from the application itself. Trusted
  // automation may use the server-only bearer token instead.
  if (hasValidServerBearer(request)) return { valid: true };

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const candidate = origin || referer;

  if (!candidate) {
    if (process.env.NODE_ENV === 'production') {
      return { valid: false, error: 'Missing request origin.' };
    }
    return { valid: true };
  }

  const requestOrigin = normalizeOrigin(candidate);
  if (!requestOrigin || !allowedOrigins().has(requestOrigin)) {
    return { valid: false, error: 'Invalid request origin.' };
  }

  return { valid: true };
}
