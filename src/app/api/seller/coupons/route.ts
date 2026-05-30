import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const action = searchParams.get('action');

    const where: Record<string, unknown> = {};
    if (storeId) {
      where.storeId = storeId;
    }

    const coupons = await db.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const mapped = coupons.map((c) => ({
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
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      description: `${c.discount}${c.type === 'percentage' ? '% off' : '$ off'} coupon`,
      descriptionAr: `كوبون خصم ${c.discount}${c.type === 'percentage' ? '٪' : '$'}`,
      totalRevenue: 0,
      totalDiscount: 0,
    }));

    if (action === 'stats') {
      const activeCoupons = mapped.filter(c => c.isActive);
      const totalUsed = mapped.reduce((sum, c) => sum + c.usedCount, 0);
      const totalRevenue = mapped.reduce((sum, c) => sum + c.totalRevenue, 0);
      const totalDiscount = mapped.reduce((sum, c) => sum + c.totalDiscount, 0);
      return Response.json({
        stats: {
          totalCoupons: mapped.length,
          activeCoupons: activeCoupons.length,
          totalUsed,
          totalRevenue,
          totalDiscount,
          avgDiscountRate: mapped.length > 0
            ? Math.round(mapped.reduce((s, c) => s + c.discount, 0) / mapped.length)
            : 0,
        },
      });
    }

    return Response.json({
      coupons: mapped,
      total: mapped.length,
    });
  } catch (error) {
    console.error('Seller Coupons API error:', error);
    return Response.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, discount, type, minOrder, maxDiscount, usageLimit, storeId, expiresAt, description, descriptionAr } = body;

    if (!code || !discount || !type) {
      return Response.json(
        { error: 'Missing required fields: code, discount, type' },
        { status: 400 }
      );
    }

    if (!['percentage', 'fixed', 'free_shipping'].includes(type)) {
      return Response.json(
        { error: 'Type must be "percentage", "fixed", or "free_shipping"' },
        { status: 400 }
      );
    }

    const coupon = await db.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount,
        type,
        minOrder: minOrder || 0,
        maxDiscount: maxDiscount || null,
        usageLimit: usageLimit || null,
        storeId: storeId || null,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return Response.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount: coupon.discount,
        type: coupon.type,
        minOrder: coupon.minOrder,
        maxDiscount: coupon.maxDiscount,
        usageLimit: coupon.usageLimit,
        usedCount: coupon.usedCount,
        storeId: coupon.storeId,
        isActive: coupon.isActive,
        expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
        createdAt: coupon.createdAt.toISOString(),
        description: description || `${discount}${type === 'percentage' ? '% off' : '$ off'} coupon`,
        descriptionAr: descriptionAr || `كوبون خصم ${discount}${type === 'percentage' ? '٪' : '$'}`,
        totalRevenue: 0,
        totalDiscount: 0,
      },
      message: 'Coupon created successfully',
      messageAr: 'تم إنشاء الكوبون بنجاح',
    }, { status: 201 });
  } catch (error) {
    console.error('Create Coupon API error:', error);
    return Response.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { couponId, isActive } = body;

    if (!couponId) {
      return Response.json(
        { error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    if (typeof isActive !== 'boolean') {
      return Response.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    await db.coupon.update({
      where: { id: couponId },
      data: { isActive },
    });

    return Response.json({
      couponId,
      isActive,
      message: isActive ? 'Coupon activated successfully' : 'Coupon deactivated successfully',
      messageAr: isActive ? 'تم تفعيل الكوبون بنجاح' : 'تم تعطيل الكوبون بنجاح',
    });
  } catch (error) {
    console.error('Toggle Coupon API error:', error);
    return Response.json({ error: 'Failed to toggle coupon' }, { status: 500 });
  }
}
