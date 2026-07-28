import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { serializeExpiredSessionCookie } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const response = NextResponse.json({ user });

    if (!user) {
      response.headers.set('Set-Cookie', serializeExpiredSessionCookie());
    }

    return response;
  } catch (error) {
    console.error('Session lookup error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
