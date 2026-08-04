import { NextResponse } from 'next/server';

/**
 * The previous Socket.IO implementation created an unattached in-memory server
 * and trusted client-supplied user identities. Chat now uses the authenticated,
 * persistent `/api/chat` route. Keep this endpoint as an explicit tombstone so
 * old clients fail safely instead of silently reconnecting to an insecure path.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Legacy Socket.IO chat is disabled.',
      replacement: '/api/chat',
    },
    { status: 410 },
  );
}
