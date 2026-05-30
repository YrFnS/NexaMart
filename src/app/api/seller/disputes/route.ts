import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return Response.json([]);
    }

    const disputes = await db.dispute.findMany({
      where: { sellerId },
      include: {
        order: true,
        buyer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = disputes.map((d) => ({
      id: d.id,
      orderId: d.orderId,
      orderNumber: d.order?.orderNumber || `ORD-${d.orderId}`,
      buyerName: d.buyer?.name || 'Customer',
      buyerEmail: d.buyer?.email || '',
      reason: d.reason,
      description: d.description,
      status: d.status,
      resolution: d.resolution,
      aiSummary: d.aiSummary,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));

    return Response.json(mapped);
  } catch (error) {
    console.error('Seller Disputes API error:', error);
    return Response.json({ error: 'Failed to fetch disputes' }, { status: 500 });
  }
}
