import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  getAdminActorId,
  validateAdminRequest,
  validateEnum,
  validatePagination,
  validateSearchParam,
} from '@/lib/security';

const VALID_PRODUCT_STATUSES = ['active', 'draft', 'archived'] as const;
const moderationSchema = z.object({
  productId: z.string().min(1).max(64),
  action: z.enum(['approve', 'flag', 'archive']),
});

export async function GET(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const search = validateSearchParam(searchParams.get('search') || '');
    const category = searchParams.get('category') || '';
    const statusRaw = searchParams.get('status') || '';
    const status = statusRaw
      ? validateEnum(statusRaw, VALID_PRODUCT_STATUSES)
      : null;
    const storeId = searchParams.get('storeId') || '';
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100,
    );

    if (statusRaw && !status) {
      return NextResponse.json({ error: 'Invalid product status.' }, { status: 400 });
    }

    const where = {
      ...(status ? { status } : {}),
      ...(category ? { categoryId: category } : {}),
      ...(storeId ? { storeId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { sku: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [products, total] = await db.$transaction([
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

    return NextResponse.json({
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: Number(product.price),
        originalPrice:
          product.originalPrice === null ? null : Number(product.originalPrice),
        stock: product.stock,
        rating: product.rating,
        reviewCount: product.reviewCount,
        soldCount: product.soldCount,
        sku: product.sku,
        status: product.status,
        isFeatured: product.isFeatured,
        isSale: product.isSale,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        storeId: product.storeId,
        storeName: product.store.name,
        images: product.images,
        createdAt: product.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin products GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  const parsed = moderationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid moderation request.' }, { status: 400 });
  }

  const adminId = getAdminActorId(request);
  if (!adminId) {
    return NextResponse.json(
      { error: 'An administrator identity is required for audit logging.' },
      { status: 401 },
    );
  }

  const statusMap = {
    approve: 'active',
    flag: 'draft',
    archive: 'archived',
  } as const;
  const newStatus = statusMap[parsed.data.action];

  try {
    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: parsed.data.productId },
        select: { id: true, name: true, status: true },
      });
      if (!product) return null;

      const updated = await tx.product.update({
        where: { id: product.id },
        data: { status: newStatus },
        select: { id: true, status: true },
      });
      await tx.auditLog.create({
        data: {
          adminId,
          action: `product_${parsed.data.action}`,
          targetType: 'product',
          targetId: product.id,
          details: JSON.stringify({
            name: product.name,
            previousStatus: product.status,
            newStatus,
          }),
        },
      });
      return updated;
    });

    if (!result) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      productId: result.id,
      status: result.status,
    });
  } catch (error) {
    console.error('Admin products PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update product.' },
      { status: 500 },
    );
  }
}
