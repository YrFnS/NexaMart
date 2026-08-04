import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const response = NextResponse.json({ user });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('Session lookup error:', error);
    const response = NextResponse.json({ user: null }, { status: 500 });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }
}
