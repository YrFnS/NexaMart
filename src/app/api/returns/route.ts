import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const buyerId = searchParams.get('buyerId');
    const sellerId = searchParams.get('sellerId');

    const where: Record<string, unknown> = {};

    if (status && status !== 'all') where.status = status;
    if (buyerId) where.buyerId = buyerId;
    if (sellerId) where.sellerId = sellerId;

    const returns = await db.return.findMany({
      where,
      include: {
        order: { select: { orderNumber: true } },
        product: { select: { name: true, images: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = returns.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      orderNumber: r.order.orderNumber,
      productId: r.productId,
      productName: r.product.name,
      productImage: r.product.images ? JSON.parse(r.product.images)[0] || '/placeholder-product.svg' : '/placeholder-product.svg',
      quantity: r.quantity,
      refundAmount: r.refundAmount,
      reason: r.reason,
      reasonLabel: r.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      details: r.details || '',
      status: r.status,
      resolution: r.resolution,
      resolutionLabel: r.resolution.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      sellerName: r.seller.name,
      sellerId: r.sellerId,
      buyerName: r.buyer.name,
      buyerId: r.buyerId,
      sellerNote: r.sellerNote || undefined,
      timeline: r.timeline ? JSON.parse(r.timeline) : [],
      evidencePhotos: r.evidencePhotos ? JSON.parse(r.evidencePhotos) : [],
    }));

    return NextResponse.json({
      returns: mapped,
      total: mapped.length,
    });
  } catch (error) {
    console.error('Returns API error:', error);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { orderId, productId, buyerId, sellerId, quantity, refundAmount, reason, details, resolution, evidencePhotos } = body;

    if (!orderId || !productId || !buyerId || !sellerId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, productId, buyerId, sellerId' },
        { status: 400 }
      );
    }

    const timeline = [
      {
        status: 'Return Requested',
        date: new Date().toISOString(),
        note: 'Buyer submitted return request',
      },
    ];

    const returnRecord = await db.return.create({
      data: {
        orderId,
        productId,
        buyerId,
        sellerId,
        quantity: quantity || 1,
        refundAmount: refundAmount ? parseFloat(refundAmount) : 0,
        reason: reason || 'other',
        details: details || null,
        resolution: resolution || 'refund',
        status: 'pending',
        evidencePhotos: evidencePhotos ? JSON.stringify(evidencePhotos) : '[]',
        timeline: JSON.stringify(timeline),
      },
      include: {
        order: { select: { orderNumber: true } },
        product: { select: { name: true, images: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
      },
    });

    const mappedReturn = {
      id: returnRecord.id,
      orderId: returnRecord.orderId,
      orderNumber: returnRecord.order.orderNumber,
      productId: returnRecord.productId,
      productName: returnRecord.product.name,
      productImage: returnRecord.product.images ? JSON.parse(returnRecord.product.images)[0] || '/placeholder-product.svg' : '/placeholder-product.svg',
      quantity: returnRecord.quantity,
      refundAmount: returnRecord.refundAmount,
      reason: returnRecord.reason,
      reasonLabel: returnRecord.reason.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      details: returnRecord.details || '',
      status: returnRecord.status,
      resolution: returnRecord.resolution,
      resolutionLabel: returnRecord.resolution.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      createdAt: returnRecord.createdAt.toISOString(),
      updatedAt: returnRecord.updatedAt.toISOString(),
      sellerName: returnRecord.seller.name,
      sellerId: returnRecord.sellerId,
      buyerName: returnRecord.buyer.name,
      buyerId: returnRecord.buyerId,
      sellerNote: returnRecord.sellerNote || undefined,
      timeline: returnRecord.timeline ? JSON.parse(returnRecord.timeline) : [],
      evidencePhotos: returnRecord.evidencePhotos ? JSON.parse(returnRecord.evidencePhotos) : [],
    };

    return NextResponse.json(
      { return: mappedReturn, message: 'Return request submitted successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Returns POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create return request' },
      { status: 500 }
    );
  }
}
