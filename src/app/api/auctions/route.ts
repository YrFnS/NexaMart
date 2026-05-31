// @ts-nocheck
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    const auctions = await db.auction.findMany({
      where,
      include: {
        product: {
          include: {
            store: { select: { name: true } },
            category: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { endTime: 'asc' },
    });

    const mapped = auctions.map((auction) => {
      const now = new Date();
      const endTime = new Date(auction.endTime);
      const timeRemaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

      let displayStatus = auction.status;
      if (auction.status === 'active' && timeRemaining < 3600) {
        displayStatus = 'ending_soon';
      }

      return {
        id: auction.id,
        title: auction.product.name,
        titleAr: auction.product.nameAr,
        currentBid: auction.currentPrice,
        startingPrice: auction.startPrice,
        bidCount: auction.bidCount,
        timeRemaining,
        imageUrl: auction.product.images ? JSON.parse(auction.product.images)[0] || '' : '',
        category: auction.product.category?.slug || '',
        status: displayStatus,
        sellerName: auction.product.store?.name || '',
      };
    });

    return Response.json({
      auctions: mapped,
      total: mapped.length,
    });
  } catch (error) {
    console.error('Auctions API error:', error);
    return Response.json({ error: 'Failed to fetch auctions' }, { status: 500 });
  }
}
