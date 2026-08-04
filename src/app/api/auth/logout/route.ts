import { NextResponse } from 'next/server';
import { validateCsrf } from '@/lib/security';
import { serializeExpiredSessionCookie } from '@/lib/session';

export async function POST(request: Request) {
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', serializeExpiredSessionCookie());
  return response;
}
