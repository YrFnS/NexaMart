import { NextResponse } from 'next/server';

function unavailable() {
  return NextResponse.json(
    {
      error:
        'Saved searches and search alerts are not available in this release.',
      code: 'FEATURE_NOT_AVAILABLE',
    },
    {
      status: 410,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

export async function GET() {
  return unavailable();
}

export async function POST() {
  return unavailable();
}

export async function DELETE() {
  return unavailable();
}
