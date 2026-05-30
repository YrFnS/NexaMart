import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    const wishlist = await db.wishlist.findMany({
      where: { userId },
      include: { product: { include: { store: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(wishlist);
  } catch (error) {
    console.error('Wishlist API error:', error);
    return Response.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, userId, action, itemId } = body;

    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    // Handle remove by wishlist item ID
    if (action === 'remove' && itemId) {
      const item = await db.wishlist.findUnique({ where: { id: itemId } });
      if (!item || item.userId !== userId) {
        return Response.json({ error: 'Wishlist item not found' }, { status: 404 });
      }
      await db.wishlist.delete({ where: { id: itemId } });
      return Response.json({ removed: true });
    }

    // Toggle by productId
    if (!productId) {
      return Response.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 401 });
    }

    const existing = await db.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await db.wishlist.delete({ where: { id: existing.id } });
      return Response.json({ removed: true });
    }

    const item = await db.wishlist.create({
      data: { userId, productId },
    });
    return Response.json(item);
  } catch (error) {
    console.error('Wishlist API error:', error);
    return Response.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
