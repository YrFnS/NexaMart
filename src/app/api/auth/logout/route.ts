import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { validateCsrf } from '@/lib/security';

export async function POST(request: Request) {
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.headers.set('Cache-Control', 'no-store');
  return clearSessionCookie(response);
}
