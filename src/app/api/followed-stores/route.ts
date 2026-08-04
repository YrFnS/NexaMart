import { NextResponse } from 'next/server';

function unavailable() {
  return NextResponse.json(
    {
      error:
        'Store following is not available in this release. Use the store directory or wishlist products instead.',
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
