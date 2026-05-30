/**
 * NexaMart Security Module
 * 
 * Comprehensive security utilities including:
 * - Rate limiting (in-memory sliding window)
 * - Admin authentication middleware
 * - Input validation & sanitization
 * - Security headers
 * - CSRF protection
 */

import { NextResponse } from 'next/server';

// ─── RATE LIMITER ──────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Max requests per window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export const RATE_LIMITS = {
  /** General API routes - 60 requests per minute */
  general: { maxRequests: 60, windowSeconds: 60 },
  /** Admin routes - 30 requests per minute */
  admin: { maxRequests: 30, windowSeconds: 60 },
  /** Auth routes - 5 requests per minute (brute force protection) */
  auth: { maxRequests: 5, windowSeconds: 60 },
  /** Write operations (POST/PUT/DELETE) - 20 requests per minute */
  write: { maxRequests: 20, windowSeconds: 60 },
  /** Seed route - 3 requests per 5 minutes */
  seed: { maxRequests: 3, windowSeconds: 300 },
  /** Search - 30 requests per minute */
  search: { maxRequests: 30, windowSeconds: 60 },
} as const;

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `${identifier}:${config.windowSeconds}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowSeconds * 1000,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetTime,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetTime,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetTime,
  };
}

/**
 * Get client identifier from request (IP address or forwarded header)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}

// ─── ADMIN AUTHENTICATION ──────────────────────────────────────────────────────

// Fail closed: if ADMIN_SECRET_KEY is not set, admin access is DENIED.
// Do NOT provide a default fallback — a missing env var should never grant access.
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || '';

/**
 * Validate admin authentication from request headers
 * Checks for Bearer token or X-Admin-Key header
 */
export function validateAdminAuth(request: Request): { authorized: boolean; error?: string } {
  // If ADMIN_SECRET_KEY is not configured, deny all admin access
  if (!ADMIN_SECRET) {
    return { authorized: false, error: 'Admin authentication is not configured. Set ADMIN_SECRET_KEY environment variable.' };
  }

  // Check Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token === ADMIN_SECRET) {
      return { authorized: true };
    }
    return { authorized: false, error: 'Invalid admin token' };
  }

  // Check X-Admin-Key header
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey) {
    if (adminKey === ADMIN_SECRET) {
      return { authorized: true };
    }
    return { authorized: false, error: 'Invalid admin key' };
  }

  return { authorized: false, error: 'Admin authentication required. Provide Authorization: Bearer <token> or X-Admin-Key header' };
}

/**
 * Middleware helper: Check admin auth and return 401 if unauthorized
 */
export function requireAdminAuth(request: Request): NextResponse | null {
  const auth = validateAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Unauthorized', message: auth.error },
      { status: 401 }
    );
  }
  return null;
}

// ─── INPUT VALIDATION ──────────────────────────────────────────────────────────

/**
 * Sanitize a string to prevent XSS when rendering
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate and clamp pagination parameters
 */
export function validatePagination(page: unknown, limit: unknown, maxLimit = 100): { page: number; limit: number } {
  const parsedPage = Math.max(1, parseInt(String(page)) || 1);
  const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(String(limit)) || 20));
  return { page: parsedPage, limit: parsedLimit };
}

/**
 * Validate that a string is a valid UUID or CUID
 */
export function isValidId(id: string): boolean {
  // CUID pattern (used by Prisma)
  const cuidRegex = /^[a-z0-9]{8,30}$/;
  // UUID pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Custom ID pattern (like WHP-001)
  const customIdRegex = /^[A-Z]{2,4}-\d{2,4}$/;
  
  return cuidRegex.test(id) || uuidRegex.test(id) || customIdRegex.test(id);
}

/**
 * Validate string search parameter - prevent injection
 */
export function validateSearchParam(search: string, maxLength = 200): string {
  if (search.length > maxLength) {
    return search.slice(0, maxLength);
  }
  // Remove potential script tags and event handlers
  return search.replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .trim();
}

/**
 * Validate enum-like parameter against allowed values
 */
export function validateEnum<T extends string>(value: string, allowed: T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

// ─── SECURITY HEADERS ──────────────────────────────────────────────────────────

export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:;",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

/**
 * Apply security headers to a NextResponse
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * Create a JSON response with security headers and rate limit info
 */
export function secureJsonResponse(
  data: unknown,
  options: {
    status?: number;
    rateLimit?: { remaining: number; resetAt: number };
  } = {}
): NextResponse {
  const response = NextResponse.json(data, { status: options.status || 200 });
  
  // Add security headers
  const secHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(secHeaders)) {
    response.headers.set(key, value);
  }
  
  // Add rate limit headers
  if (options.rateLimit) {
    response.headers.set('X-RateLimit-Remaining', String(options.rateLimit.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(options.rateLimit.resetAt / 1000)));
  }
  
  return response;
}

/**
 * Create a rate limit exceeded response (429)
 */
export function rateLimitResponse(resetAt: number): NextResponse {
  const response = NextResponse.json(
    { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' },
    { status: 429 }
  );
  response.headers.set('Retry-After', String(Math.ceil((resetAt - Date.now()) / 1000)));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  return response;
}

// ─── COMBINED MIDDLEWARE HELPERS ───────────────────────────────────────────────

/**
 * Check rate limit for an API request and return rate-limited response if exceeded
 */
export function checkApiRateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.general
): { allowed: boolean; remaining: number; resetAt: number; response?: NextResponse } {
  const clientId = getClientIdentifier(request);
  const result = checkRateLimit(clientId, config);
  
  if (!result.allowed) {
    return { ...result, response: rateLimitResponse(result.resetAt) };
  }
  
  return result;
}

/**
 * Full admin API request validation:
 * 1. Rate limit check
 * 2. Admin authentication
 * Returns null if all checks pass, or the error response if any check fails
 */
export function validateAdminRequest(
  request: Request,
  config: RateLimitConfig = RATE_LIMITS.admin
): NextResponse | null {
  // Check rate limit
  const rateResult = checkApiRateLimit(request, config);
  if (!rateResult.allowed && rateResult.response) {
    return rateResult.response;
  }
  
  // Check admin auth
  const authResponse = requireAdminAuth(request);
  if (authResponse) {
    return authResponse;
  }
  
  return null; // All checks passed
}

// ─── CSRF PROTECTION ───────────────────────────────────────────────────────────

/**
 * Validate CSRF token for state-changing operations
 * Checks Origin/Referer headers match the allowed origins
 */
export function validateCsrf(request: Request): { valid: boolean; error?: string } {
  const method = request.method.toUpperCase();
  
  // Only check state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return { valid: true };
  }
  
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // Allow requests without origin/referer from server-side (SSR)
  // In production, you'd want to be stricter
  if (!origin && !referer) {
    // Could be from SSR or API client - allow for now
    return { valid: true };
  }
  
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'http://localhost:3000',
  ];
  
  if (origin && !allowedOrigins.some(o => origin.startsWith(o))) {
    return { valid: false, error: 'Invalid origin' };
  }
  
  if (referer && !allowedOrigins.some(o => referer.startsWith(o))) {
    return { valid: false, error: 'Invalid referer' };
  }
  
  return { valid: true };
}
