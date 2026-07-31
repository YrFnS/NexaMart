import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  checkDistributedRateLimit,
  type DistributedRateLimitResult,
} from './lib/distributed-rate-limit';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
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

function applyRateLimitHeaders(
  response: NextResponse,
  rateLimit: DistributedRateLimitResult,
): NextResponse {
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
  response.headers.set(
    'X-RateLimit-Reset',
    String(Math.ceil(rateLimit.resetAt / 1_000)),
  );
  return response;
}

function rateLimitDenied(rateLimit: DistributedRateLimitResult): NextResponse {
  const response = jsonError(
    429,
    'Too many requests',
    'Rate limit exceeded. Please try again later.',
  );
  response.headers.set(
    'Retry-After',
    String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1_000))),
  );
  return applyRateLimitHeaders(response, rateLimit);
}

function rateLimiterUnavailable(
  rateLimit: DistributedRateLimitResult,
): NextResponse {
  const response = jsonError(
    503,
    'Rate limiter unavailable',
    'Request protection is temporarily unavailable. Please try again shortly.',
  );
  response.headers.set('Retry-After', '5');
  return applyRateLimitHeaders(response, rateLimit);
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

function rateLimitPolicy(pathname: string): {
  maxRequests: number;
  windowSeconds: number;
} {
  if (pathname.startsWith('/api/admin/')) {
    return { maxRequests: 30, windowSeconds: 60 };
  }
  if (pathname.startsWith('/api/ai/')) {
    return { maxRequests: 8, windowSeconds: 60 };
  }
  if (pathname.startsWith('/api/support/')) {
    return { maxRequests: 20, windowSeconds: 60 };
  }
  if (
    pathname.startsWith('/api/auth/') &&
    pathname !== '/api/auth/session'
  ) {
    return { maxRequests: 5, windowSeconds: 60 };
  }
  if (pathname === '/api/products' || pathname === '/api/search') {
    return { maxRequests: 30, windowSeconds: 60 };
  }
  return { maxRequests: 60, windowSeconds: 60 };
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

  const policy = rateLimitPolicy(pathname);
  const rateLimit = await checkDistributedRateLimit({
    namespace: `${request.method}:${pathname}`,
    identifier: getClientIp(request),
    maxRequests: policy.maxRequests,
    windowSeconds: policy.windowSeconds,
  });

  if (rateLimit.unavailable) return rateLimiterUnavailable(rateLimit);
  if (!rateLimit.allowed) return rateLimitDenied(rateLimit);

  // Preserve the existing public FAQ payload while routing every private ticket
  // read and write through the session-scoped support endpoint.
  if (pathname === '/api/help') {
    const action = request.nextUrl.searchParams.get('action');

    if (request.method === 'GET' && action === 'faq') {
      // Static FAQ content is public.
    } else if (request.method === 'GET' && action === 'tickets') {
      return applyRateLimitHeaders(
        applySecurityHeaders(NextResponse.rewrite(supportRewriteUrl(request))),
        rateLimit,
      );
    } else if (request.method === 'GET' && !action) {
      return applyRateLimitHeaders(
        await buildHelpCompatibilityResponse(request),
        rateLimit,
      );
    } else if (request.method === 'POST') {
      return applyRateLimitHeaders(
        applySecurityHeaders(NextResponse.rewrite(supportRewriteUrl(request))),
        rateLimit,
      );
    } else {
      return applyRateLimitHeaders(
        jsonError(405, 'Method not allowed', 'Unsupported help operation.'),
        rateLimit,
      );
    }
  }

  if (pathname.startsWith('/api/admin/')) {
    const sessionUser = hasValidAdminBearer(request)
      ? null
      : await getCurrentSessionUser(request);
    const authorized =
      hasValidAdminBearer(request) || sessionUser?.role === 'admin';

    if (!authorized) {
      return applyRateLimitHeaders(
        jsonError(
          401,
          'Unauthorized',
          'A current administrator session or trusted server bearer token is required.',
        ),
        rateLimit,
      );
    }
  }

  const response = applyRateLimitHeaders(
    applySecurityHeaders(NextResponse.next()),
    rateLimit,
  );

  if (pathname.startsWith('/api/')) {
    response.headers.set('Content-Security-Policy', "default-src 'none'");
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
