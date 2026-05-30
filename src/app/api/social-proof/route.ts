import { db } from '@/lib/db';

export async function GET() {
  try {
    // Fetch recent completed orders with user and product info to generate social proof
    const recentOrders = await db.order.findMany({
      where: { status: 'delivered' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        items: {
          take: 1,
          include: {
            product: {
              select: { name: true, nameAr: true },
            },
          },
        },
        user: {
          select: { name: true },
        },
      },
    });

    const proofs = recentOrders
      .filter(order => order.items.length > 0 && order.user)
      .map(order => {
        const item = order.items[0];
        const user = order.user;
        const product = item.product;
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - orderDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeAgo = 'Just now';
        let timeAgoAr = 'الآن';
        if (diffDays > 0) {
          timeAgo = `${diffDays}d ago`;
          timeAgoAr = `منذ ${diffDays} أيام`;
        } else if (diffHours > 0) {
          timeAgo = `${diffHours}h ago`;
          timeAgoAr = `منذ ${diffHours} ساعات`;
        } else if (diffMins > 0) {
          timeAgo = `${diffMins}m ago`;
          timeAgoAr = `منذ ${diffMins} دقيقة`;
        }

        // Derive city from shipping address JSON
        let city = '';
        let cityAr = '';
        try {
          const addr = JSON.parse(order.shippingAddress || '{}');
          city = addr.city || '';
          cityAr = addr.city || '';
        } catch {
          // ignore parse errors
        }

        return {
          name: user.name?.split(' ')[0] || 'Someone',
          nameAr: user.name?.split(' ')[0] || 'شخص',
          city,
          cityAr,
          product: product.name || 'a product',
          productAr: product.nameAr || product.name || 'منتج',
          timeAgo,
          timeAgoAr,
        };
      });

    return Response.json({ proofs });
  } catch (error) {
    console.error('Social proof API error:', error);
    return Response.json({ proofs: [] }, { status: 200 });
  }
}
