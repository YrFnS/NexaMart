import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in-memory, per-instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `${ip}:${request.nextUrl.pathname}`;
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // ─── SECURITY HEADERS ────────────────────────────────────────────────────
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // CSP for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Content-Security-Policy', "default-src 'none'");
  }

  // ─── RATE LIMITING ──────────────────────────────────────────────────────
  const key = getRateLimitKey(request);

  // API rate limits
  if (pathname.startsWith('/api/')) {
    let maxRequests = 60; // Default: 60 req/min
    let windowMs = 60 * 1000; // 1 minute

    if (pathname.startsWith('/api/admin/')) {
      maxRequests = 30;
      windowMs = 60 * 1000;
    } else if (pathname.startsWith('/api/seed')) {
      maxRequests = 3;
      windowMs = 5 * 60 * 1000; // 3 req per 5 min
    } else if (pathname.startsWith('/api/auth/')) {
      maxRequests = 5;
      windowMs = 60 * 1000;
    } else if (pathname === '/api/products' || pathname === '/api/search') {
      maxRequests = 30;
      windowMs = 60 * 1000;
    }

    if (!checkRateLimit(key, maxRequests, windowMs)) {
      return NextResponse.json(
        { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Add rate limit headers
    const entry = rateLimitMap.get(key);
    if (entry) {
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));
    }
  }

  // ─── ADMIN API AUTH CHECK ──────────────────────────────────────────────
  if (pathname.startsWith('/api/admin/')) {
    const adminSecret = process.env.ADMIN_SECRET_KEY || '';

    // Fail closed: if ADMIN_SECRET_KEY is not set, deny admin access
    if (!adminSecret) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin authentication is not configured. Set ADMIN_SECRET_KEY environment variable.' },
        { status: 401 }
      );
    }

    const adminKey = request.headers.get('x-admin-key');
    const authHeader = request.headers.get('authorization');

    let authorized = false;

    if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === adminSecret) {
      authorized = true;
    } else if (adminKey === adminSecret) {
      authorized = true;
    }

    // Only allow dev bypass if explicitly enabled via ALLOW_DEV_ADMIN_BYPASS=true
    // This is dangerous and should NEVER be used in production
    if (process.env.ALLOW_DEV_ADMIN_BYPASS === 'true') {
      authorized = true;
    }

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin authentication required. Provide Authorization: Bearer <token> or X-Admin-Key header.' },
        { status: 401 }
      );
    }
  }

  // ─── SEED ROUTE PROTECTION ─────────────────────────────────────────────
  if (pathname === '/api/seed') {
    // Only allow POST method for seed route (not GET which can be triggered by browsers)
    if (request.method === 'GET') {
      return NextResponse.json(
        { error: 'Method not allowed', message: 'Seed route requires POST method with admin authentication for security.' },
        { status: 405 }
      );
    }
    
    // ALWAYS require admin auth for seed route, regardless of environment.
    // Set ADMIN_SECRET_KEY env var to enable seeding. Example:
    //   ADMIN_SECRET_KEY=nexamart-admin-secret-change-in-production
    const adminKey = request.headers.get('x-admin-key');
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET_KEY || '';

    // Fail closed: if ADMIN_SECRET_KEY is not set, deny access
    if (!adminSecret) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin authentication is not configured. Set ADMIN_SECRET_KEY environment variable.' },
        { status: 401 }
      );
    }

    let authorized = false;
    if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === adminSecret) {
      authorized = true;
    } else if (adminKey === adminSecret) {
      authorized = true;
    }

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Seed route requires admin authentication.' },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
