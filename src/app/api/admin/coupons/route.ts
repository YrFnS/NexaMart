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
    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const result = coupons.map(c => ({
      id: c.id,
      code: c.code,
      discount: c.discount,
      type: c.type,
      minOrder: c.minOrder,
      maxDiscount: c.maxDiscount,
      usageLimit: c.usageLimit,
      usedCount: c.usedCount,
      storeId: c.storeId,
      isActive: c.isActive,
      expiresAt: c.expiresAt?.toISOString() || null,
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ coupons: result, total: result.length });
  } catch (error) {
    console.error('Admin coupons GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const body = await request.json();
    const { code, discount, type, minOrder, maxDiscount, usageLimit, storeId, isActive, expiresAt, adminId } = body;

    if (!code || discount === undefined) {
      return NextResponse.json({ error: 'Missing code or discount' }, { status: 400 });
    }

    // Check for duplicate code
    const existing = await db.coupon.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    const coupon = await db.coupon.create({
      data: {
        code,
        discount: parseFloat(String(discount)),
        type: type || 'percentage',
        minOrder: minOrder ? parseFloat(String(minOrder)) : 0,
        maxDiscount: maxDiscount ? parseFloat(String(maxDiscount)) : null,
        usageLimit: usageLimit || null,
        storeId: storeId || null,
        isActive: isActive !== false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminId: adminId || 'system',
        action: 'coupon_created',
        targetType: 'coupon',
        targetId: coupon.id,
        details: `Coupon created: ${code}`,
      },
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error) {
    console.error('Admin coupons POST error:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
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
    const { couponId, isActive, expiresAt, discount, type, minOrder, maxDiscount, usageLimit, adminId } = body;

    if (!couponId) {
      return NextResponse.json({ error: 'Missing couponId' }, { status: 400 });
    }

    const coupon = await db.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (discount !== undefined) updateData.discount = parseFloat(String(discount));
    if (type !== undefined) updateData.type = type;
    if (minOrder !== undefined) updateData.minOrder = parseFloat(String(minOrder));
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? parseFloat(String(maxDiscount)) : null;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;

    await db.coupon.update({ where: { id: couponId }, data: updateData });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminId: adminId || 'system',
        action: 'coupon_updated',
        targetType: 'coupon',
        targetId: couponId,
        details: `Coupon updated: ${coupon.code}`,
      },
    });

    return NextResponse.json({ success: true, couponId });
  } catch (error) {
    console.error('Admin coupons PUT error:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get('id');
    const adminId = searchParams.get('adminId');

    if (!couponId) {
      return NextResponse.json({ error: 'Missing coupon id' }, { status: 400 });
    }

    const coupon = await db.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    await db.coupon.delete({ where: { id: couponId } });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminId: adminId || 'system',
        action: 'coupon_deleted',
        targetType: 'coupon',
        targetId: couponId,
        details: `Coupon deleted: ${coupon.code}`,
      },
    });

    return NextResponse.json({ success: true, couponId });
  } catch (error) {
    console.error('Admin coupons DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
