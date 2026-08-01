import 'server-only';

import { Prisma } from '@prisma/client';
import { cache } from 'react';
import { db } from '@/lib/db';
import type {
  HomePageData,
  ProductDetailData,
  ProductListingData,
  ProductListingQuery,
  SitemapStorefrontData,
  StorefrontCategory,
  StorefrontHeroBanner,
  StorefrontProduct,
  StorefrontProductVariant,
  StorefrontReviewsData,
  StorefrontStoreSummary,
  StoreListingData,
  StoreListingQuery,
  StorePageData,
} from '@/lib/storefront-types';

const publicCategorySelect = {
  id: true,
  name: true,
  nameAr: true,
  slug: true,
  icon: true,
  image: true,
  _count: {
    select: { products: { where: { status: 'active' } } },
  },
} satisfies Prisma.CategorySelect;

const productCategorySelect = {
  id: true,
  name: true,
  nameAr: true,
  slug: true,
} satisfies Prisma.CategorySelect;

const productStoreSelect = {
  id: true,
  name: true,
  nameAr: true,
  rating: true,
  isVerified: true,
  location: true,
  _count: {
    select: { products: { where: { status: 'active' } } },
  },
} satisfies Prisma.StoreSelect;

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
    select: { products: { where: { status: 'active' } } },
  },
} satisfies Prisma.StoreSelect;

const productCardSelect = {
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
  category: { select: productCategorySelect },
  store: { select: productStoreSelect },
  _count: {
    select: { variantSkus: { where: { isActive: true } } },
  },
} satisfies Prisma.ProductSelect;

const variantSelect = {
  id: true,
  sku: true,
  attributes: true,
  optionKey: true,
  price: true,
  originalPrice: true,
  stock: true,
  isActive: true,
} satisfies Prisma.ProductVariantSelect;

const productDetailSelect = {
  ...productCardSelect,
  variantSkus: {
    where: { isActive: true },
    orderBy: [{ price: 'asc' }, { sku: 'asc' }],
    select: variantSelect,
  },
} satisfies Prisma.ProductSelect;

const heroBannerSelect = {
  id: true,
  title: true,
  titleAr: true,
  description: true,
  descriptionAr: true,
  ctaText: true,
  ctaTextAr: true,
  ctaLink: true,
  gradient: true,
  icon: true,
} satisfies Prisma.BannerSelect;

type CategoryRecord = Prisma.CategoryGetPayload<{
  select: typeof publicCategorySelect;
}>;
type StoreRecord = Prisma.StoreGetPayload<{ select: typeof publicStoreSelect }>;
type ProductCardRecord = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;
type ProductVariantRecord = Prisma.ProductVariantGetPayload<{
  select: typeof variantSelect;
}>;
type ProductRecord = ProductCardRecord & {
  variantSkus?: ProductVariantRecord[];
};
type HeroBannerRecord = Prisma.BannerGetPayload<{
  select: typeof heroBannerSelect;
}>;

function optional(value: string | null): string | undefined {
  return value ?? undefined;
}

function serializeCategory(category: CategoryRecord): StorefrontCategory {
  return {
    id: category.id,
    name: category.name,
    nameAr: optional(category.nameAr),
    slug: category.slug,
    icon: optional(category.icon),
    image: optional(category.image),
    productCount: category._count.products,
  };
}

function serializeStore(store: StoreRecord): StorefrontStoreSummary {
  const createdAt = store.createdAt.toISOString();
  return {
    id: store.id,
    name: store.name,
    nameAr: optional(store.nameAr),
    description: optional(store.description),
    descriptionAr: optional(store.descriptionAr),
    slug: store.slug,
    logo: optional(store.logo),
    banner: optional(store.banner),
    isVerified: store.isVerified,
    rating: store.rating,
    reviewCount: store.reviewCount,
    productCount: store._count.products,
    location: optional(store.location),
    memberSince: createdAt,
    createdAt,
    updatedAt: store.updatedAt.toISOString(),
  };
}

function serializeVariant(
  variant: ProductVariantRecord,
): StorefrontProductVariant {
  return {
    id: variant.id,
    sku: variant.sku,
    attributes: variant.attributes,
    optionKey: variant.optionKey,
    price: Number(variant.price),
    originalPrice:
      variant.originalPrice === null
        ? undefined
        : Number(variant.originalPrice),
    stock: variant.stock,
    isActive: variant.isActive,
  };
}

function serializeProduct(product: ProductRecord): StorefrontProduct {
  return {
    id: product.id,
    name: product.name,
    nameAr: optional(product.nameAr),
    description: optional(product.description),
    descriptionAr: optional(product.descriptionAr),
    price: Number(product.price),
    originalPrice:
      product.originalPrice === null
        ? undefined
        : Number(product.originalPrice),
    images: product.images,
    categoryId: product.categoryId,
    storeId: product.storeId,
    sku: optional(product.sku),
    stock: product.stock,
    rating: product.rating,
    reviewCount: product.reviewCount,
    soldCount: product.soldCount,
    views: product.views,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isSale: product.isSale,
    isB2b: product.isB2b,
    hasFreeShipping: product.hasFreeShipping,
    variations: product.variations,
    tieredPricing: product.tieredPricing,
    tags: product.tags,
    status: product.status,
    hasVariants: product._count.variantSkus > 0,
    variantSkus: product.variantSkus?.map(serializeVariant),
    category: {
      id: product.category.id,
      name: product.category.name,
      nameAr: optional(product.category.nameAr),
      slug: product.category.slug,
    },
    store: {
      id: product.store.id,
      name: product.store.name,
      nameAr: optional(product.store.nameAr),
      rating: product.store.rating,
      isVerified: product.store.isVerified,
      location: optional(product.store.location),
      productCount: product.store._count.products,
    },
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function serializeHeroBanner(
  banner: HeroBannerRecord,
): StorefrontHeroBanner {
  return {
    id: banner.id,
    title: banner.title,
    titleAr: optional(banner.titleAr),
    description: optional(banner.description),
    descriptionAr: optional(banner.descriptionAr),
    ctaText: optional(banner.ctaText),
    ctaTextAr: optional(banner.ctaTextAr),
    ctaLink: optional(banner.ctaLink),
    gradient: optional(banner.gradient),
    icon: optional(banner.icon),
  };
}

const emptyHomePageData: HomePageData = {
  categories: [],
  products: [],
  stores: [],
  heroBanners: [],
};

export const getHomePageData = cache(async (): Promise<HomePageData> => {
  try {
    const now = new Date();
    const [categories, products, stores, heroBanners] = await Promise.all([
      db.category.findMany({
        where: { parentId: null },
        orderBy: [{ name: 'asc' }],
        take: 20,
        select: publicCategorySelect,
      }),
      db.product.findMany({
        where: { status: 'active' },
        orderBy: [
          { isFeatured: 'desc' },
          { isSale: 'desc' },
          { soldCount: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 24,
        select: productCardSelect,
      }),
      db.store.findMany({
        orderBy: [
          { isVerified: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 12,
        select: publicStoreSelect,
      }),
      db.banner.findMany({
        where: {
          position: 'hero',
          isActive: true,
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: now } }] },
            { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          ],
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 6,
        select: heroBannerSelect,
      }),
    ]);

    return {
      categories: categories.map(serializeCategory),
      products: products.map(serializeProduct),
      stores: stores.map(serializeStore),
      heroBanners: heroBanners.map(serializeHeroBanner),
    };
  } catch (error) {
    console.error('Server homepage data error:', error);
    return emptyHomePageData;
  }
});

export const getProductDetailData = cache(
  async (productId: string): Promise<ProductDetailData | null> => {
    const id = productId.trim().slice(0, 64);
    if (!id) return null;

    const product = await db.product.findFirst({
      where: { id, status: 'active' },
      select: productDetailSelect,
    });
    if (!product) return null;

    const [similarProducts, relatedProducts] = await Promise.all([
      db.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
          status: 'active',
        },
        orderBy: [{ rating: 'desc' }, { soldCount: 'desc' }],
        take: 8,
        select: productCardSelect,
      }),
      db.product.findMany({
        where: {
          categoryId: { not: product.categoryId },
          id: { not: product.id },
          status: 'active',
        },
        orderBy: [{ soldCount: 'desc' }, { rating: 'desc' }],
        take: 4,
        select: productCardSelect,
      }),
    ]);

    return {
      product: serializeProduct(product as ProductRecord),
      similarProducts: similarProducts.map(serializeProduct),
      relatedProducts: relatedProducts.map(serializeProduct),
    };
  },
);

export const getStoreReviewsData = cache(
  async (storeId: string, limit = 20): Promise<StorefrontReviewsData> => {
    const boundedLimit = Math.min(50, Math.max(1, limit));
    const where: Prisma.StoreReviewWhereInput = { storeId };
    const [reviews, aggregate, groupedRatings] = await db.$transaction([
      db.storeReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: boundedLimit,
        select: {
          id: true,
          userId: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      }),
      db.storeReview.aggregate({
        where,
        _avg: { rating: true },
        _count: { _all: true },
      }),
      db.storeReview.groupBy({
        by: ['rating'],
        where,
        _count: { _all: true },
      }),
    ]);

    const userIds = [...new Set(reviews.map((review) => review.userId))];
    const users =
      userIds.length > 0
        ? await db.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, avatar: true },
          })
        : [];
    const userById = new Map(users.map((user) => [user.id, user]));
    const total = aggregate._count._all;
    const countByRating = new Map(
      groupedRatings.map((entry) => [entry.rating, entry._count._all]),
    );

    return {
      reviews: reviews.map((review) => {
        const user = userById.get(review.userId);
        return {
          id: review.id,
          userName: user?.name || 'Anonymous',
          userAvatar: user?.avatar || null,
          rating: review.rating,
          comment: review.comment || '',
          date: review.createdAt.toISOString(),
        };
      }),
      total,
      averageRating:
        aggregate._avg.rating === null
          ? 0
          : Math.round(aggregate._avg.rating * 10) / 10,
      ratingDistribution: Object.fromEntries(
        [5, 4, 3, 2, 1].map((rating) => {
          const count = countByRating.get(rating) || 0;
          return [
            String(rating),
            {
              count,
              percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            },
          ];
        }),
      ),
    };
  },
);

export const getStorePageData = cache(
  async (storeId: string): Promise<StorePageData | null> => {
    const id = storeId.trim().slice(0, 64);
    if (!id) return null;

    const store = await db.store.findUnique({
      where: { id },
      select: publicStoreSelect,
    });
    if (!store) return null;

    const [products, similarStores, reviews] = await Promise.all([
      db.product.findMany({
        where: { storeId: id, status: 'active' },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take: 24,
        select: productCardSelect,
      }),
      db.store.findMany({
        where: { id: { not: id } },
        orderBy: [
          { isVerified: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 4,
        select: publicStoreSelect,
      }),
      getStoreReviewsData(id, 20),
    ]);

    return {
      store: serializeStore(store),
      products: products.map(serializeProduct),
      similarStores: similarStores.map(serializeStore),
      reviews,
    };
  },
);

export async function getProductListingData(
  query: ProductListingQuery,
): Promise<ProductListingData> {
  const where: Prisma.ProductWhereInput = {
    status: 'active',
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.freeShipping ? { hasFreeShipping: true } : {}),
    ...(query.b2bOnly ? { isB2b: true } : {}),
    ...(query.onSale ? { isSale: true } : {}),
    ...(query.minRating !== undefined
      ? { rating: { gte: query.minRating } }
      : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? {
          price: {
            ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
            ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { nameAr: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { tags: { contains: query.search, mode: 'insensitive' } },
            { sku: { contains: query.search, mode: 'insensitive' } },
            {
              variantSkus: {
                some: {
                  sku: { contains: query.search, mode: 'insensitive' },
                },
              },
            },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    query.sort === 'price-asc'
      ? { price: 'asc' }
      : query.sort === 'price-desc'
        ? { price: 'desc' }
        : query.sort === 'rating'
          ? { rating: 'desc' }
          : query.sort === 'popular'
            ? { soldCount: 'desc' }
            : { createdAt: 'desc' };

  const [products, total, categories] = await db.$transaction([
    db.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: productCardSelect,
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      take: 100,
      select: publicCategorySelect,
    }),
  ]);

  return {
    products: products.map(serializeProduct),
    categories: categories.map(serializeCategory),
    total,
    page: query.page,
    pages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getStoreListingData(
  query: StoreListingQuery,
): Promise<StoreListingData> {
  const where: Prisma.StoreWhereInput = {
    ...(query.verifiedOnly ? { isVerified: true } : {}),
    ...(query.minRating !== undefined
      ? { rating: { gte: query.minRating } }
      : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { nameAr: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { location: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.StoreOrderByWithRelationInput =
    query.sort === 'products'
      ? { productCount: 'desc' }
      : query.sort === 'newest'
        ? { createdAt: 'desc' }
        : { rating: 'desc' };

  const [stores, total] = await db.$transaction([
    db.store.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: publicStoreSelect,
    }),
    db.store.count({ where }),
  ]);

  return {
    stores: stores.map(serializeStore),
    total,
    page: query.page,
    pages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export const getSitemapStorefrontData = cache(
  async (): Promise<SitemapStorefrontData> => {
    const [products, stores, categories] = await Promise.all([
      db.product.findMany({
        where: { status: 'active' },
        orderBy: { updatedAt: 'desc' },
        take: 50_000,
        select: { id: true, updatedAt: true },
      }),
      db.store.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 50_000,
        select: { id: true, updatedAt: true },
      }),
      db.category.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10_000,
        select: { slug: true, createdAt: true },
      }),
    ]);
    return { products, stores, categories };
  },
);

export function parseImageList(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
