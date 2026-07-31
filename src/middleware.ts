import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Best-effort per-instance throttling. Authoritative distributed rate limiting
// remains a deployment concern; route handlers also apply endpoint limits.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function getRateLimitKey(request: NextRequest): string {
  return `${getClientIp(request)}:${request.nextUrl.pathname}`;
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count += 1;
  return true;
}

function hasValidAdminBearer(request: NextRequest): boolean {
  const configuredSecret = process.env.ADMIN_SECRET_KEY;
  if (!configuredSecret) return false;
  return request.headers.get('authorization') === `Bearer ${configuredSecret}`;
}

async function hasCurrentAdminSession(request: NextRequest): Promise<boolean> {
  const cookie = request.headers.get('cookie');
  if (!cookie) return false;

  try {
    const sessionUrl = new URL('/api/auth/session', request.url);
    const response = await fetch(sessionUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        cookie,
        'x-forwarded-for': getClientIp(request),
      },
    });

    if (!response.ok) return false;

    const payload = (await response.json()) as {
      user?: { role?: string } | null;
    };
    return payload.user?.role === 'admin';
  } catch {
    // Fail closed when the current database-backed session cannot be checked.
    return false;
  }
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)',
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  );
  return response;
}

function jsonError(
  status: number,
  error: string,
  message: string,
): NextResponse {
  return applySecurityHeaders(
    NextResponse.json({ error, message }, { status }),
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // HTTP database seeding is intentionally unavailable in every environment.
  // Operators must use the trusted CLI seed command instead.
  if (pathname === '/api/seed') {
    return jsonError(
      404,
      'Not found',
      'HTTP database seeding is disabled. Use the trusted deployment CLI.',
    );
  }

  const key = getRateLimitKey(request);
  let maxRequests = 60;
  let windowMs = 60 * 1000;

  if (pathname.startsWith('/api/admin/')) {
    maxRequests = 30;
  } else if (
    pathname.startsWith('/api/auth/') &&
    pathname !== '/api/auth/session'
  ) {
    maxRequests = 5;
  } else if (pathname === '/api/products' || pathname === '/api/search') {
    maxRequests = 30;
  }

  if (!checkRateLimit(key, maxRequests, windowMs)) {
    return jsonError(
      429,
      'Too many requests',
      'Rate limit exceeded. Please try again later.',
    );
  }

  if (pathname.startsWith('/api/admin/')) {
    const authorized =
      hasValidAdminBearer(request) || (await hasCurrentAdminSession(request));

    if (!authorized) {
      return jsonError(
        401,
        'Unauthorized',
        'A current administrator session or trusted server bearer token is required.',
      );
    }
  }

  const response = applySecurityHeaders(NextResponse.next());
  const entry = rateLimitMap.get(key);
  if (entry) {
    response.headers.set(
      'X-RateLimit-Remaining',
      String(Math.max(0, maxRequests - entry.count)),
    );
    response.headers.set(
      'X-RateLimit-Reset',
      String(Math.ceil(entry.resetTime / 1000)),
    );
  }

  if (pathname.startsWith('/api/')) {
    response.headers.set('Content-Security-Policy', "default-src 'none'");
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
