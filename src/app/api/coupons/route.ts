import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const where: Record<string, unknown> = {};
    if (action === 'available') {
      where.isActive = true;
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }

    const coupons = await db.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const mapped = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.type === 'percentage' ? 'percentage' : c.type === 'fixed' ? 'fixed' : 'free_shipping',
      discountValue: c.discount,
      minOrder: c.minOrder,
      maxDiscount: c.maxDiscount,
      expiry: c.expiresAt ? c.expiresAt.toISOString() : null,
      description: `${c.discount}${c.type === 'percentage' ? '% off' : '$ off'} coupon`,
      descriptionAr: `كوبون خصم ${c.discount}${c.type === 'percentage' ? '٪' : '$'}`,
      isActive: c.isActive,
      usageCount: c.usedCount,
      usageLimit: c.usageLimit,
      category: c.storeId ? 'store' : 'platform',
    }));

    return Response.json({ coupons: mapped, total: mapped.length });
  } catch (error) {
    console.error('Coupons API error:', error);
    return Response.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code) {
      return Response.json(
        { valid: false, error: 'Coupon code is required', errorAr: 'رمز الكوبون مطلوب' },
        { status: 400 }
      );
    }

    const upperCode = code.toUpperCase().trim();
    const coupon = await db.coupon.findUnique({
      where: { code: upperCode },
    });

    if (!coupon) {
      return Response.json({
        valid: false,
        error: 'Invalid coupon code',
        errorAr: 'رمز الكوبون غير صالح',
      });
    }

    if (!coupon.isActive) {
      return Response.json({
        valid: false,
        error: 'This coupon is no longer active',
        errorAr: 'هذا الكوبون لم يعد فعالاً',
      });
    }

    const now = new Date();
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      return Response.json({
        valid: false,
        error: 'This coupon has expired',
        errorAr: 'انتهت صلاحية هذا الكوبون',
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return Response.json({
        valid: false,
        error: 'This coupon has reached its usage limit',
        errorAr: 'لقد وصل هذا الكوبون إلى حد الاستخدام',
      });
    }

    const orderSubtotal = subtotal || 0;
    if (orderSubtotal < coupon.minOrder) {
      return Response.json({
        valid: false,
        error: `Minimum order of $${coupon.minOrder} required`,
        errorAr: `الحد الأدنى للطلب ${coupon.minOrder}$`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = orderSubtotal * (coupon.discount / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = coupon.discount;
    } else if (coupon.type === 'free_shipping') {
      discountAmount = coupon.maxDiscount || 0;
    }

    return Response.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.type,
        discountValue: coupon.discount,
        minOrder: coupon.minOrder,
        maxDiscount: coupon.maxDiscount,
        description: `${coupon.discount}${coupon.type === 'percentage' ? '% off' : '$ off'} coupon`,
        descriptionAr: `كوبون خصم ${coupon.discount}${coupon.type === 'percentage' ? '٪' : '$'}`,
        expiry: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
      },
      discountAmount,
    });
  } catch (error) {
    console.error('Validate Coupon API error:', error);
    return Response.json({ valid: false, error: 'Failed to validate coupon' }, { status: 500 });
  }
}
