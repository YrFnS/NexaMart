import { NextResponse } from 'next/server';

// Saved searches are stored client-side in localStorage
// This API route returns empty array — no DB model needed for now

export async function GET() {
  return NextResponse.json({ searches: [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, category, minPrice, maxPrice, notificationsEnabled } = body;

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const savedSearch = {
      id: `ss-${Date.now()}`,
      query: query.trim(),
      category: category || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      createdAt: new Date().toISOString(),
      notificationsEnabled: notificationsEnabled !== false,
      newItemsCount: 0,
    };

    return NextResponse.json({ search: savedSearch }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Search ID is required' }, { status: 400 });
    }

    return NextResponse.json({ deleted: true, id });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
