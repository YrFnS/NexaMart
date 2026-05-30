import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkApiRateLimit, RATE_LIMITS, requireAdminAuth } from '@/lib/security';

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier') || '';
    const verified = searchParams.get('verified') || '';

    const where: Record<string, unknown> = {};
    if (tier) where.tier = tier;
    if (verified === 'true') where.isVerified = true;
    else if (verified === 'false') where.isVerified = false;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const stores = await db.store.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true, walletBalance: true } },
        _count: { select: { products: true, orders: true } },
      },
    });

    const result = stores.map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      logo: s.logo,
      isVerified: s.isVerified,
      rating: s.rating,
      reviewCount: s.reviewCount,
      productCount: s.productCount,
      tier: s.tier,
      commission: s.commission,
      ownerId: s.ownerId,
      ownerName: s.owner.name || 'Unknown',
      ownerEmail: s.owner.email,
      ownerWalletBalance: s.owner.walletBalance,
      orderCount: s._count.orders,
      actualProductCount: s._count.products,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({ stores: result, total: result.length });
  } catch (error) {
    console.error('Admin stores GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const body = await request.json();
    const { storeId, action, value, adminId } = body;

    if (!storeId || !action) {
      return NextResponse.json({ error: 'Missing storeId or action' }, { status: 400 });
    }

    const store = await db.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (action === 'verify') updateData.isVerified = true;
    else if (action === 'unverify') updateData.isVerified = false;
    else if (action === 'set_tier') updateData.tier = value || 'free';
    else if (action === 'set_commission') updateData.commission = parseFloat(value) || 10;
    else {
      return NextResponse.json({ error: 'Invalid action. Use verify, unverify, set_tier, or set_commission' }, { status: 400 });
    }

    await db.store.update({ where: { id: storeId }, data: updateData });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminId: adminId || 'system',
        action: `store_${action}`,
        targetType: 'store',
        targetId: storeId,
        details: `Store ${store.name} updated: ${action}${value ? ` = ${value}` : ''}`,
      },
    });

    return NextResponse.json({ success: true, storeId, action });
  } catch (error) {
    console.error('Admin stores PUT error:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}
