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

async function getCurrentSessionUser(
  request: NextRequest,
): Promise<{ id?: string; role?: string } | null> {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;

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

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      user?: { id?: string; role?: string } | null;
    };
    return payload.user || null;
  } catch {
    return null;
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

function forwardedHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  headers.set('x-forwarded-for', getClientIp(request));
  return headers;
}

async function buildHelpCompatibilityResponse(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const faqUrl = new URL('/api/help', request.url);
    faqUrl.searchParams.set('action', 'faq');
    const ticketsUrl = new URL('/api/support/tickets', request.url);

    const headers = forwardedHeaders(request);
    const [faqResponse, ticketsResponse] = await Promise.all([
      fetch(faqUrl, { cache: 'no-store', headers }),
      fetch(ticketsUrl, { cache: 'no-store', headers }),
    ]);

    if (!faqResponse.ok) {
      return jsonError(502, 'Help unavailable', 'Failed to load help content.');
    }

    const faqPayload = (await faqResponse.json()) as {
      categories?: unknown[];
    };
    let ticketPayload: { tickets?: unknown[]; total?: number } = {};
    if (ticketsResponse.ok) {
      ticketPayload = (await ticketsResponse.json()) as {
        tickets?: unknown[];
        total?: number;
      };
    }

    const response = NextResponse.json({
      faqCategories: faqPayload.categories || [],
      tickets: ticketPayload.tickets || [],
      ticketTotal: ticketPayload.total || 0,
    });
    response.headers.set('Cache-Control', 'no-store');
    return applySecurityHeaders(response);
  } catch {
    return jsonError(502, 'Help unavailable', 'Failed to load help content.');
  }
}

function supportRewriteUrl(request: NextRequest): URL {
  const url = new URL('/api/support/tickets', request.url);
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    if (key !== 'action') url.searchParams.append(key, value);
  }
  return url;
}

function requestBodyLimit(request: NextRequest): number | null {
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) return null;

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api/ai/')) return 256_000;
  if (pathname.startsWith('/api/support/') || pathname === '/api/help') {
    return 64_000;
  }
  return null;
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

  const bodyLimit = requestBodyLimit(request);
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (
    bodyLimit !== null &&
    Number.isFinite(declaredLength) &&
    declaredLength > bodyLimit
  ) {
    return jsonError(
      413,
      'Request too large',
      `Request bodies for this endpoint must be ${bodyLimit} bytes or fewer.`,
    );
  }

  const key = getRateLimitKey(request);
  let maxRequests = 60;
  const windowMs = 60 * 1000;

  if (pathname.startsWith('/api/admin/')) {
    maxRequests = 30;
  } else if (pathname.startsWith('/api/ai/')) {
    maxRequests = 8;
  } else if (pathname.startsWith('/api/support/')) {
    maxRequests = 20;
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

  // Preserve the existing public FAQ payload while routing every private ticket
  // read and write through the session-scoped support endpoint.
  if (pathname === '/api/help') {
    const action = request.nextUrl.searchParams.get('action');

    if (request.method === 'GET' && action === 'faq') {
      // Static FAQ content is public.
    } else if (request.method === 'GET' && action === 'tickets') {
      return applySecurityHeaders(
        NextResponse.rewrite(supportRewriteUrl(request)),
      );
    } else if (request.method === 'GET' && !action) {
      return buildHelpCompatibilityResponse(request);
    } else if (request.method === 'POST') {
      return applySecurityHeaders(
        NextResponse.rewrite(supportRewriteUrl(request)),
      );
    } else {
      return jsonError(405, 'Method not allowed', 'Unsupported help operation.');
    }
  }

  if (pathname.startsWith('/api/admin/')) {
    const sessionUser = hasValidAdminBearer(request)
      ? null
      : await getCurrentSessionUser(request);
    const authorized =
      hasValidAdminBearer(request) || sessionUser?.role === 'admin';

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
