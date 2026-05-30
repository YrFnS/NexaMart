import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');

    const where: Record<string, unknown> = {};
    if (ownerId) where.ownerId = ownerId;

    const stores = await db.store.findMany({
      where,
      include: { owner: { select: { name: true, avatar: true } } },
      orderBy: { rating: 'desc' },
    });
    return Response.json(stores);
  } catch (error) {
    console.error('Stores API error:', error);
    return Response.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}
