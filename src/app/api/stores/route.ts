import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import {
  validateEnum,
  validatePagination,
  validateSearchParam,
} from '@/lib/security';

const STORE_SORTS = ['rating', 'products', 'newest'] as const;

const publicStoreSelect = {
  id: true,
  name: true,
  nameAr: true,
  description: true,
  descriptionAr: true,
  slug: true,
  logo: true,
  banner: true,
  isVerified: true,
  rating: true,
  reviewCount: true,
  location: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      products: { where: { status: 'active' } },
    },
  },
} satisfies Prisma.StoreSelect;

type PublicStoreRecord = Prisma.StoreGetPayload<{
  select: typeof publicStoreSelect;
}>;

function serializeStore(store: PublicStoreRecord) {
  return {
    id: store.id,
    name: store.name,
    nameAr: store.nameAr,
    description: store.description,
    descriptionAr: store.descriptionAr,
    slug: store.slug,
    logo: store.logo,
    banner: store.banner,
    isVerified: store.isVerified,
    rating: store.rating,
    reviewCount: store.reviewCount,
    productCount: store._count.products,
    location: store.location,
    memberSince: store.createdAt.toISOString(),
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString(),
  };
}

function validId(value: string | null): string | null {
  const id = value?.trim() || '';
  return id.length > 0 && id.length <= 64 ? id : null;
}

function minimumRating(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(5, Math.max(0, parsed));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedId = searchParams.get('id');

    if (requestedId !== null) {
      const id = validId(requestedId);
      if (!id) {
        return Response.json({ error: 'Invalid store ID.' }, { status: 400 });
      }

      const store = await db.store.findUnique({
        where: { id },
        select: publicStoreSelect,
      });
      if (!store) {
        return Response.json({ error: 'Store not found.' }, { status: 404 });
      }

      const similarStores = await db.store.findMany({
        where: { id: { not: id } },
        orderBy: [{ isVerified: 'desc' }, { rating: 'desc' }],
        take: 4,
        select: publicStoreSelect,
      });

      return Response.json({
        store: serializeStore(store),
        similarStores: similarStores.map(serializeStore),
      });
    }

    const searchRaw = searchParams.get('search');
    const search = searchRaw ? validateSearchParam(searchRaw) : undefined;
    const minRating = minimumRating(searchParams.get('minRating'));
    const verifiedOnly = searchParams.get('verified') === 'true';
    const sort =
      validateEnum(searchParams.get('sort') || 'rating', STORE_SORTS) ||
      'rating';
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      50,
    );

    const where: Prisma.StoreWhereInput = {
      ...(verifiedOnly ? { isVerified: true } : {}),
      ...(minRating !== undefined ? { rating: { gte: minRating } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { nameAr: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { descriptionAr: { contains: search, mode: 'insensitive' } },
              { location: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.StoreOrderByWithRelationInput =
      sort === 'newest'
        ? { createdAt: 'desc' }
        : sort === 'products'
          ? { products: { _count: 'desc' } }
          : { rating: 'desc' };

    const [stores, total] = await db.$transaction([
      db.store.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: publicStoreSelect,
      }),
      db.store.count({ where }),
    ]);

    return Response.json({
      stores: stores.map(serializeStore),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Stores API error:', error);
    return Response.json(
      { error: 'Failed to fetch stores.' },
      { status: 500 },
    );
  }
}
