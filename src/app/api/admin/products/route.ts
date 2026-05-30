import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validatePagination, validateSearchParam, validateEnum, isValidId, checkApiRateLimit, RATE_LIMITS, requireAdminAuth } from '@/lib/security';

const VALID_PRODUCT_STATUSES = ['active', 'draft', 'archived'] as const;

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const { searchParams } = new URL(request.url);
    const searchRaw = searchParams.get('search') || '';
    const search = searchRaw ? validateSearchParam(searchRaw) : '';
    const category = searchParams.get('category') || '';
    const statusRaw = searchParams.get('status') || '';
    const status = statusRaw ? validateEnum(statusRaw, [...VALID_PRODUCT_STATUSES]) || '' : '';
    const storeId = searchParams.get('storeId') || '';
    const { page, limit } = validatePagination(searchParams.get('page'), searchParams.get('limit'), 100);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.categoryId = category;
    if (storeId) where.storeId = storeId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
        },
      }),
      db.product.count({ where }),
    ]);

    const result = products.map(p => ({
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
      price: p.price,
      originalPrice: p.originalPrice,
      stock: p.stock,
      rating: p.rating,
      reviewCount: p.reviewCount,
      soldCount: p.soldCount,
      sku: p.sku,
      status: p.status,
      isFeatured: p.isFeatured,
      isSale: p.isSale,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      storeId: p.storeId,
      storeName: p.store.name,
      images: p.images,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({ products: result, total, page, limit });
  } catch (error) {
    console.error('Admin products GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
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
    const { productId, action, adminId } = body;

    if (!productId || !action) {
      return NextResponse.json({ error: 'Missing productId or action' }, { status: 400 });
    }

    // Validate productId format
    if (typeof productId === 'string' && !isValidId(productId)) {
      return NextResponse.json({ error: 'Invalid productId format' }, { status: 400 });
    }

    // Validate action against allowed values
    const validActions = ['approve', 'flag', 'archive'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use approve, flag, or archive' }, { status: 400 });
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      approve: 'active',
      flag: 'draft',
      archive: 'archived',
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      return NextResponse.json({ error: 'Invalid action. Use approve, flag, or archive' }, { status: 400 });
    }

    await db.product.update({
      where: { id: productId },
      data: { status: newStatus },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminId: adminId || 'system',
        action: `product_${action}`,
        targetType: 'product',
        targetId: productId,
        details: `Product status changed to ${newStatus}`,
      },
    });

    return NextResponse.json({ success: true, productId, status: newStatus });
  } catch (error) {
    console.error('Admin products PUT error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
