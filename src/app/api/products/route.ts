import { db } from '@/lib/db';
import { validatePagination, validateSearchParam, validateEnum } from '@/lib/security';

const VALID_SORTS = ['newest', 'price-asc', 'price-desc', 'rating', 'popular'] as const;

// Products API route
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const searchRaw = searchParams.get('search');
    const search = searchRaw ? validateSearchParam(searchRaw) : undefined;
    const sortRaw = searchParams.get('sort') || 'newest';
    const sort = validateEnum(sortRaw, [...VALID_SORTS]) || 'newest';
    const featured = searchParams.get('featured');
    const onSale = searchParams.get('sale');
    const isNew = searchParams.get('new');
    const b2b = searchParams.get('b2b');
    const freeShipping = searchParams.get('freeShipping');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const idsRaw = searchParams.get('ids');
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100 // max 100 products per page
    );

    const where: Record<string, unknown> = {};

    if (idsRaw) {
      // When fetching by IDs, don't apply status filter (user wants specific products)
      const ids = idsRaw.split(',').filter(Boolean).slice(0, 20);
      if (ids.length > 0) where.id = { in: ids };
    }
    // Note: We intentionally do NOT filter by status = 'active' here.
    // The seed data creates products without an explicit status field,
    // and Prisma createMany may not always apply DB-level defaults.
    // Filtering by status was causing 0 results on seeded databases.
    // Status filtering should be done at the application level if needed.

    if (category) where.categoryId = category;
    if (featured === 'true') where.isFeatured = true;
    if (onSale === 'true') where.isSale = true;
    if (isNew === 'true') where.isNew = true;
    if (b2b === 'true') where.isB2b = true;
    if (freeShipping === 'true') where.hasFreeShipping = true;
    if (minPrice || maxPrice) {
      where.price = {};
      const min = minPrice ? Math.max(0, parseFloat(minPrice)) : undefined;
      const max = maxPrice ? Math.min(10000000, parseFloat(maxPrice)) : undefined;
      if (min !== undefined && !isNaN(min)) (where.price as Record<string, number>).gte = min;
      if (max !== undefined && !isNaN(max)) (where.price as Record<string, number>).lte = max;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> = {};
    switch (sort) {
      case 'price-asc': orderBy.price = 'asc'; break;
      case 'price-desc': orderBy.price = 'desc'; break;
      case 'rating': orderBy.rating = 'desc'; break;
      case 'popular': orderBy.soldCount = 'desc'; break;
      default: orderBy.createdAt = 'desc';
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true, store: true },
      }),
      db.product.count({ where }),
    ]);

    return Response.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Products API error:', error);
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
