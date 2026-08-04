import { NextResponse } from 'next/server';

function disabled() {
  return NextResponse.json(
    {
      error: 'Installment and payment services are not available in this release.',
      code: 'PAYMENTS_DISABLED',
    },
    { status: 410 },
  );
}

export async function GET() {
  return disabled();
}

export async function POST() {
  return disabled();
}

export async function PUT() {
  return disabled();
}

export async function DELETE() {
  return disabled();
}
