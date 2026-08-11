import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request, {
      includeSellerWorkspaceAccess: true,
    });

    // A read-only session probe must never clear cookies. An anonymous probe
    // can still be in flight when a login succeeds; expiring the cookie from
    // that stale response would erase the newly issued authenticated session.
    // Explicit logout remains responsible for cookie removal.
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Session lookup error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
