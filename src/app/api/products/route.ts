import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import {
  validateEnum,
  validatePagination,
  validateSearchParam,
} from '@/lib/security';

const VALID_SORTS = [
  'newest',
  'price-asc',
  'price-desc',
  'rating',
  'popular',
] as const;

function parsePrice(value: string | null, max: number): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(max, Math.max(0, parsed));
}

const publicProductSelect = {
  id: true,
  name: true,
  nameAr: true,
  description: true,
  descriptionAr: true,
  price: true,
  originalPrice: true,
  images: true,
  categoryId: true,
  storeId: true,
  sku: true,
  stock: true,
  rating: true,
  reviewCount: true,
  soldCount: true,
  views: true,
  isFeatured: true,
  isNew: true,
  isSale: true,
  isB2b: true,
  hasFreeShipping: true,
  variations: true,
  tieredPricing: true,
  tags: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: { id: true, name: true, nameAr: true, slug: true },
  },
  store: {
    select: {
      id: true,
      name: true,
      nameAr: true,
      rating: true,
      isVerified: true,
      location: true,
      productCount: true,
    },
  },
  _count: { select: { variantSkus: { where: { isActive: true } } } },
} satisfies Prisma.ProductSelect;

function publicProduct(product: Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>) {
  return {
    ...product,
    price: Number(product.price),
    originalPrice:
      product.originalPrice === null ? null : Number(product.originalPrice),
    hasVariants: product._count.variantSkus > 0,
    _count: undefined,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const searchRaw = searchParams.get('search');
    const search = searchRaw ? validateSearchParam(searchRaw) : undefined;
    const sort =
      validateEnum(searchParams.get('sort') || 'newest', VALID_SORTS) || 'newest';
    const ids = (searchParams.get('ids') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 20);
    const minPrice = parsePrice(searchParams.get('minPrice'), 10_000_000);
    const maxPrice = parsePrice(searchParams.get('maxPrice'), 10_000_000);
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100,
    );

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return Response.json(
        { error: 'Minimum price cannot exceed maximum price.' },
        { status: 400 },
      );
    }

    const where: Prisma.ProductWhereInput = {
      status: 'active',
      ...(ids.length > 0 ? { id: { in: ids } } : {}),
      ...(category ? { categoryId: category } : {}),
      ...(searchParams.get('featured') === 'true' ? { isFeatured: true } : {}),
      ...(searchParams.get('sale') === 'true' ? { isSale: true } : {}),
      ...(searchParams.get('new') === 'true' ? { isNew: true } : {}),
      ...(searchParams.get('b2b') === 'true' ? { isB2b: true } : {}),
      ...(searchParams.get('freeShipping') === 'true'
        ? { hasFreeShipping: true }
        : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { nameAr: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { tags: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              {
                variantSkus: {
                  some: { sku: { contains: search, mode: 'insensitive' } },
                },
              },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'price-asc'
        ? { price: 'asc' }
        : sort === 'price-desc'
          ? { price: 'desc' }
          : sort === 'rating'
            ? { rating: 'desc' }
            : sort === 'popular'
              ? { soldCount: 'desc' }
              : { createdAt: 'desc' };

    const [products, total] = await db.$transaction([
      db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: publicProductSelect,
      }),
      db.product.count({ where }),
    ]);

    return Response.json({
      products: products.map(publicProduct),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Products API error:', error);
    return Response.json(
      { error: 'Failed to fetch products.' },
      { status: 500 },
    );
  }
}
