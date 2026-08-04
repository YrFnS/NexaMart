import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserRole, type AuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  buildVariationDefinition,
  normalizeVariantAttributes,
  ProductVariantError,
  variantOptionKey,
} from '@/lib/product-variants';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
  validatePagination,
  validateSearchParam,
} from '@/lib/security';

const STATUSES = ['active', 'draft', 'archived'] as const;
const variantSchema = z
  .object({
    id: z.string().min(1).max(64).optional(),
    sku: z.string().trim().min(2).max(96),
    attributes: z.record(z.string(), z.string()),
    price: z.coerce.number().finite().min(0).max(1_000_000_000),
    originalPrice: z.coerce.number().finite().min(0).max(1_000_000_000).optional().nullable(),
    stock: z.coerce.number().int().min(0).max(100_000_000),
    isActive: z.boolean().default(true),
  })
  .strict();

const productFields = z
  .object({
    storeId: z.string().min(1).max(64).optional(),
    name: z.string().trim().min(3).max(180),
    nameAr: z.string().trim().max(180).optional().nullable(),
    description: z.string().trim().max(10_000).optional().nullable(),
    descriptionAr: z.string().trim().max(10_000).optional().nullable(),
    categoryId: z.string().min(1).max(64),
    images: z.array(z.string().trim().max(2_000)).max(12).default([]),
    tags: z.array(z.string().trim().max(80)).max(40).default([]),
    status: z.enum(STATUSES).default('draft'),
    hasFreeShipping: z.boolean().default(false),
    isB2b: z.boolean().default(false),
    sku: z.string().trim().min(2).max(96).optional().nullable(),
    price: z.coerce.number().finite().min(0).max(1_000_000_000).optional(),
    originalPrice: z.coerce.number().finite().min(0).max(1_000_000_000).optional().nullable(),
    stock: z.coerce.number().int().min(0).max(100_000_000).optional(),
    variants: z.array(variantSchema).max(200).default([]),
  })
  .strict();

const updateSchema = productFields.extend({
  productId: z.string().min(1).max(64),
});

class SellerProductError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

function storeAccessWhere(user: AuthenticatedUser): Prisma.StoreWhereInput {
  if (user.role === 'admin') return {};
  return {
    OR: [
      { ownerId: user.id },
      {
        staff: {
          some: {
            userId: user.id,
            status: 'active',
            role: { in: ['owner', 'manager', 'editor'] },
          },
        },
      },
    ],
  };
}

async function resolveWritableStore(
  user: AuthenticatedUser,
  storeId?: string,
) {
  const stores = await db.store.findMany({
    where: {
      ...storeAccessWhere(user),
      ...(storeId ? { id: storeId } : {}),
    },
    select: { id: true, name: true },
    take: storeId ? 1 : 2,
  });

  if (stores.length === 0) {
    throw new SellerProductError('A writable seller store is required.', 403);
  }
  if (!storeId && stores.length > 1) {
    throw new SellerProductError('Select which store should own this product.');
  }
  return stores[0];
}

function parseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function mapProduct(product: Prisma.ProductGetPayload<{
  include: {
    category: { select: { id: true; name: true; nameAr: true } };
    store: { select: { id: true; name: true } };
    variantSkus: true;
  };
}>) {
  return {
    ...product,
    price: Number(product.price),
    originalPrice:
      product.originalPrice === null ? null : Number(product.originalPrice),
    images: parseArray(product.images),
    tags: parseArray(product.tags),
    variantSkus: product.variantSkus.map((variant) => ({
      ...variant,
      attributes: JSON.parse(variant.attributes) as Record<string, string>,
      price: Number(variant.price),
      originalPrice:
        variant.originalPrice === null
          ? null
          : Number(variant.originalPrice),
    })),
  };
}

function normalizeWrite(input: z.infer<typeof productFields>) {
  const seenSkus = new Set<string>();
  const seenKeys = new Set<string>();
  const variants = input.variants.map((variant) => {
    const attributes = normalizeVariantAttributes(variant.attributes);
    const optionKey = variantOptionKey(attributes);
    const sku = variant.sku.toUpperCase();
    if (seenSkus.has(sku)) {
      throw new SellerProductError(`Duplicate variant SKU: ${sku}`);
    }
    if (seenKeys.has(optionKey)) {
      throw new SellerProductError('Two variants cannot use the same option combination.');
    }
    seenSkus.add(sku);
    seenKeys.add(optionKey);
    return { ...variant, sku, attributes, optionKey };
  });

  if (variants.length > 0) {
    const active = variants.filter((variant) => variant.isActive);
    if (active.length === 0) {
      throw new SellerProductError('A variant product needs at least one active SKU.');
    }
    return {
      variants,
      sku: null,
      price: Math.min(...active.map((variant) => variant.price)),
      originalPrice:
        active.map((variant) => variant.originalPrice).filter((value): value is number => value !== null && value !== undefined).sort((a, b) => a - b)[0] || null,
      stock: active.reduce((sum, variant) => sum + variant.stock, 0),
      variations: buildVariationDefinition(active),
    };
  }

  if (input.price === undefined || input.stock === undefined || !input.sku) {
    throw new SellerProductError('Simple products require SKU, price, and stock.');
  }

  return {
    variants: [],
    sku: input.sku.toUpperCase(),
    price: input.price,
    originalPrice: input.originalPrice ?? null,
    stock: input.stock,
    variations: '{}',
  };
}

function commonProductData(
  input: z.infer<typeof productFields>,
  normalized: ReturnType<typeof normalizeWrite>,
) {
  return {
    name: input.name,
    nameAr: input.nameAr || null,
    description: input.description || null,
    descriptionAr: input.descriptionAr || null,
    categoryId: input.categoryId,
    images: JSON.stringify(input.images),
    tags: JSON.stringify(input.tags),
    status: input.status,
    hasFreeShipping: input.hasFreeShipping,
    isB2b: input.isB2b,
    sku: normalized.sku,
    price: normalized.price,
    originalPrice: normalized.originalPrice,
    stock: normalized.stock,
    variations: normalized.variations,
  };
}

const includeProduct = {
  category: { select: { id: true, name: true, nameAr: true } },
  store: { select: { id: true, name: true } },
  variantSkus: { orderBy: { createdAt: 'asc' as const } },
} as const;

export async function GET(request: Request) {
  const auth = await requireUserRole(request, ['seller', 'admin']);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = validateSearchParam(searchParams.get('search') || '', 180);
    const status = searchParams.get('status');
    const storeId = searchParams.get('storeId') || undefined;
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100,
    );
    if (status && !STATUSES.includes(status as (typeof STATUSES)[number])) {
      return NextResponse.json({ error: 'Invalid product status.' }, { status: 400 });
    }

    const accessibleStores = await db.store.findMany({
      where: { ...storeAccessWhere(auth.user), ...(storeId ? { id: storeId } : {}) },
      select: { id: true },
    });
    const storeIds = accessibleStores.map((store) => store.id);
    if (storeIds.length === 0) {
      return NextResponse.json({ products: [], total: 0, page, limit });
    }

    const where: Prisma.ProductWhereInput = {
      storeId: { in: storeIds },
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { variantSkus: { some: { sku: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [products, total, stores] = await db.$transaction([
      db.product.findMany({
        where,
        include: includeProduct,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
      db.store.findMany({
        where: { id: { in: storeIds } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({
      products: products.map(mapProduct),
      stores,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Seller products GET error:', error);
    return NextResponse.json({ error: 'Failed to load seller products.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin.' }, { status: 403 });
  }
  const auth = await requireUserRole(request, ['seller', 'admin']);
  if (auth.response) return auth.response;

  const parsed = productFields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the product details.' }, { status: 400 });
  }

  try {
    const store = await resolveWritableStore(auth.user, parsed.data.storeId);
    const normalized = normalizeWrite(parsed.data);
    const product = await db.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { id: parsed.data.categoryId },
        select: { id: true },
      });
      if (!category) throw new SellerProductError('Product category not found.', 404);

      const created = await tx.product.create({
        data: {
          ...commonProductData(parsed.data, normalized),
          storeId: store.id,
          variantSkus: normalized.variants.length
            ? {
                create: normalized.variants.map((variant) => ({
                  sku: variant.sku,
                  attributes: variant.optionKey,
                  optionKey: variant.optionKey,
                  price: variant.price,
                  originalPrice: variant.originalPrice ?? null,
                  stock: variant.stock,
                  isActive: variant.isActive,
                })),
              }
            : undefined,
        },
        include: includeProduct,
      });
      await tx.store.update({
        where: { id: store.id },
        data: { productCount: { increment: 1 } },
      });
      await tx.category.update({
        where: { id: parsed.data.categoryId },
        data: { productCount: { increment: 1 } },
      });
      return created;
    });

    return NextResponse.json({ product: mapProduct(product) }, { status: 201 });
  } catch (error) {
    if (error instanceof SellerProductError || error instanceof ProductVariantError) {
      return NextResponse.json({ error: error.message }, { status: error instanceof SellerProductError ? error.status : 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A product or variant SKU already exists.' }, { status: 409 });
    }
    console.error('Seller products POST error:', error);
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin.' }, { status: 403 });
  }
  const auth = await requireUserRole(request, ['seller', 'admin']);
  if (auth.response) return auth.response;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the product details.' }, { status: 400 });
  }

  try {
    const { productId, ...input } = parsed.data;
    const existing = await db.product.findFirst({
      where: { id: productId, store: storeAccessWhere(auth.user) },
      include: { variantSkus: true },
    });
    if (!existing) throw new SellerProductError('Product not found.', 404);
    if (input.storeId && input.storeId !== existing.storeId) {
      await resolveWritableStore(auth.user, input.storeId);
    }

    const normalized = normalizeWrite(input);
    const updated = await db.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { id: input.categoryId },
        select: { id: true },
      });
      if (!category) throw new SellerProductError('Product category not found.', 404);

      if (existing.variantSkus.length > 0) {
        await tx.productVariant.updateMany({
          where: { productId },
          data: { isActive: false },
        });
      }

      for (const variant of normalized.variants) {
        const current = variant.id
          ? existing.variantSkus.find((item) => item.id === variant.id)
          : existing.variantSkus.find((item) => item.sku === variant.sku);
        if (variant.id && !current) {
          throw new SellerProductError('A submitted variant does not belong to this product.', 409);
        }

        if (current) {
          await tx.productVariant.update({
            where: { id: current.id },
            data: {
              sku: variant.sku,
              attributes: variant.optionKey,
              optionKey: variant.optionKey,
              price: variant.price,
              originalPrice: variant.originalPrice ?? null,
              stock: variant.stock,
              isActive: variant.isActive,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId,
              sku: variant.sku,
              attributes: variant.optionKey,
              optionKey: variant.optionKey,
              price: variant.price,
              originalPrice: variant.originalPrice ?? null,
              stock: variant.stock,
              isActive: variant.isActive,
            },
          });
        }
      }

      const product = await tx.product.update({
        where: { id: productId },
        data: {
          ...commonProductData(input, normalized),
          storeId: input.storeId || existing.storeId,
        },
        include: includeProduct,
      });

      if (existing.categoryId !== input.categoryId) {
        await tx.category.update({
          where: { id: existing.categoryId },
          data: { productCount: { decrement: 1 } },
        });
        await tx.category.update({
          where: { id: input.categoryId },
          data: { productCount: { increment: 1 } },
        });
      }
      return product;
    });

    return NextResponse.json({ product: mapProduct(updated) });
  } catch (error) {
    if (error instanceof SellerProductError || error instanceof ProductVariantError) {
      return NextResponse.json({ error: error.message }, { status: error instanceof SellerProductError ? error.status : 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A product or variant SKU already exists.' }, { status: 409 });
    }
    console.error('Seller products PUT error:', error);
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin.' }, { status: 403 });
  }
  const auth = await requireUserRole(request, ['seller', 'admin']);
  if (auth.response) return auth.response;

  const productId = new URL(request.url).searchParams.get('id');
  if (!productId) {
    return NextResponse.json({ error: 'Product id is required.' }, { status: 400 });
  }

  try {
    const product = await db.product.findFirst({
      where: { id: productId, store: storeAccessWhere(auth.user) },
      select: { id: true },
    });
    if (!product) throw new SellerProductError('Product not found.', 404);

    await db.$transaction([
      db.productVariant.updateMany({
        where: { productId },
        data: { isActive: false },
      }),
      db.product.update({
        where: { id: productId },
        data: { status: 'archived', stock: 0 },
      }),
    ]);
    return NextResponse.json({ success: true, productId, status: 'archived' });
  } catch (error) {
    if (error instanceof SellerProductError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Seller products DELETE error:', error);
    return NextResponse.json({ error: 'Failed to archive product.' }, { status: 500 });
  }
}
