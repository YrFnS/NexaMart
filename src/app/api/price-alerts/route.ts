import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (productId) where.productId = productId;
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    const alerts = await db.priceAlert.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            nameAr: true,
            images: true,
            store: { select: { name: true, nameAr: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = alerts.map((a) => ({
      id: a.id,
      productId: a.productId,
      productName: a.product.name,
      productNameAr: a.product.nameAr,
      productImage: a.product.images ? JSON.parse(a.product.images)[0] || '' : '',
      currentPrice: a.currentPrice,
      targetPrice: a.targetPrice,
      alertType: 'below_price' as const,
      status: a.isNotified ? 'triggered' as const : a.isActive ? 'active' as const : 'expired' as const,
      notificationMethod: 'both' as const,
      createdAt: a.createdAt.toISOString().split('T')[0],
      expiresAt: a.expiresAt ? a.expiresAt.toISOString().split('T')[0] : '',
      priceHistory: [],
    }));

    const stats = {
      totalAlerts: mapped.length,
      activeAlerts: mapped.filter(a => a.status === 'active').length,
      triggeredAlerts: mapped.filter(a => a.status === 'triggered').length,
      expiredAlerts: mapped.filter(a => a.status === 'expired').length,
    };

    return NextResponse.json({
      alerts: mapped,
      recentPriceDrops: [],
      stats,
    });
  } catch (error) {
    console.error('Price Alerts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch price alerts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, targetPrice, expiresAt } = body;

    if (!userId || !productId || !targetPrice) {
      return NextResponse.json({ error: 'userId, productId, and targetPrice are required' }, { status: 400 });
    }

    // Get current price
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { price: true, name: true, nameAr: true, images: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const alert = await db.priceAlert.create({
      data: {
        userId,
        productId,
        targetPrice: parseFloat(targetPrice),
        currentPrice: product.price,
        isActive: true,
        isNotified: false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({
      alert: {
        id: alert.id,
        productId: alert.productId,
        productName: product.name,
        productNameAr: product.nameAr,
        productImage: product.images ? JSON.parse(product.images)[0] || '' : '',
        currentPrice: alert.currentPrice,
        targetPrice: alert.targetPrice,
        alertType: 'below_price',
        status: 'active',
        notificationMethod: 'both',
        createdAt: alert.createdAt.toISOString().split('T')[0],
        expiresAt: alert.expiresAt ? alert.expiresAt.toISOString().split('T')[0] : '',
        priceHistory: [],
      },
      message: 'Price alert created successfully',
    });
  } catch (error) {
    console.error('Create Price Alert API error:', error);
    return NextResponse.json({ error: 'Failed to create price alert' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    await db.priceAlert.delete({
      where: { id: alertId },
    });

    return NextResponse.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Delete Price Alert API error:', error);
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }
}
