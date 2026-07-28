import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
  validatePagination,
} from '@/lib/security';

const createSchema = z.object({
  productId: z.string().min(1).max(64),
  targetPrice: z.coerce.number().finite().positive().max(1_000_000_000),
  expiresAt: z.coerce.date().optional().nullable(),
});

function parseImages(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((image): image is string => typeof image === 'string')
      : [];
  } catch {
    return [];
  }
}

function mapAlert(alert: {
  id: string;
  productId: string;
  currentPrice: number;
  targetPrice: number;
  isActive: boolean;
  isNotified: boolean;
  createdAt: Date;
  expiresAt: Date | null;
  product: {
    name: string;
    nameAr: string | null;
    images: string;
  };
}) {
  return {
    id: alert.id,
    productId: alert.productId,
    productName: alert.product.name,
    productNameAr: alert.product.nameAr || alert.product.name,
    productImage: parseImages(alert.product.images)[0] || '',
    currentPrice: Number(alert.currentPrice),
    targetPrice: Number(alert.targetPrice),
    alertType: 'below_price' as const,
    status: alert.isNotified
      ? ('triggered' as const)
      : alert.isActive
        ? ('active' as const)
        : ('expired' as const),
    notificationMethod: 'both' as const,
    createdAt: alert.createdAt.toISOString().slice(0, 10),
    expiresAt: alert.expiresAt?.toISOString().slice(0, 10) || '',
    priceHistory: [] as { date: string; price: number }[],
  };
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || undefined;
    const active = searchParams.get('isActive');
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100,
    );
    const where = {
      userId: auth.user.id,
      ...(productId ? { productId } : {}),
      ...(active === 'true' ? { isActive: true } : {}),
      ...(active === 'false' ? { isActive: false } : {}),
    };

    const alerts = await db.priceAlert.findMany({
      where,
      include: {
        product: {
          select: { name: true, nameAr: true, images: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const mapped = alerts.map(mapAlert);

    return NextResponse.json({
      alerts: mapped,
      recentPriceDrops: [],
      stats: {
        totalAlerts: mapped.length,
        activeAlerts: mapped.filter((alert) => alert.status === 'active').length,
        triggeredAlerts: mapped.filter((alert) => alert.status === 'triggered').length,
        expiredAlerts: mapped.filter((alert) => alert.status === 'expired').length,
      },
      page,
      limit,
    });
  } catch (error) {
    console.error('Price alerts GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price alerts.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid price alert details.' }, { status: 400 });
  }

  try {
    const product = await db.product.findFirst({
      where: { id: parsed.data.productId, status: 'active' },
      select: { id: true, price: true, name: true, nameAr: true, images: true },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const existing = await db.priceAlert.findFirst({
      where: { userId: auth.user.id, productId: product.id, isActive: true },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'An active alert already exists for this product.' },
        { status: 409 },
      );
    }

    const alert = await db.priceAlert.create({
      data: {
        userId: auth.user.id,
        productId: product.id,
        targetPrice: parsed.data.targetPrice,
        currentPrice: product.price,
        isActive: true,
        isNotified: false,
        expiresAt: parsed.data.expiresAt || null,
      },
      include: {
        product: { select: { name: true, nameAr: true, images: true } },
      },
    });

    return NextResponse.json(
      { alert: mapAlert(alert), message: 'Price alert created.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Price alerts POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create price alert.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const alertId = new URL(request.url).searchParams.get('id');
  if (!alertId) {
    return NextResponse.json({ error: 'Alert id is required.' }, { status: 400 });
  }

  try {
    const removed = await db.priceAlert.deleteMany({
      where: { id: alertId, userId: auth.user.id },
    });
    if (removed.count !== 1) {
      return NextResponse.json({ error: 'Price alert not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: alertId });
  } catch (error) {
    console.error('Price alerts DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete price alert.' },
      { status: 500 },
    );
  }
}
