from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    content = target.read_text(encoding="utf-8")
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path}, found {count}: {old[:120]!r}")
    target.write_text(content.replace(old, new, 1), encoding="utf-8")


def write(path: str, content: str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


# ─── Prisma schema ────────────────────────────────────────────────────────────
replace_once(
    "prisma/schema.prisma",
    "  returns       Return[]\n  auctions      Auction[]\n\n  @@index([status, createdAt])",
    "  returns       Return[]\n  auctions      Auction[]\n  variantSkus   ProductVariant[]\n\n  @@index([status, createdAt])",
)
replace_once(
    "prisma/schema.prisma",
    "model Order {\n",
    '''model ProductVariant {
  id            String   @id @default(cuid())
  productId     String
  sku           String   @unique
  attributes    String   // canonical JSON object shown to users and orders
  optionKey     String   // canonical JSON key used for uniqueness/lookups
  price         Float
  originalPrice Float?
  stock         Int      @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  product    Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderItems OrderItem[]

  @@unique([productId, optionKey])
  @@index([productId, isActive])
}

model Order {
''',
)
replace_once(
    "prisma/schema.prisma",
    '''model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Float
  total     Float
  variation String? // JSON

  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])
}
''',
    '''model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  variantId String?
  quantity  Int
  price     Float
  total     Float
  variation String? // canonical JSON snapshot

  order   Order           @relation(fields: [orderId], references: [id])
  product Product         @relation(fields: [productId], references: [id])
  variant ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  @@index([variantId])
}
''',
)

write(
    "prisma/migrations/product_variants_20260731/migration.sql",
    '''-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "attributes" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_optionKey_key" ON "ProductVariant"("productId", "optionKey");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_isActive_idx" ON "ProductVariant"("productId", "isActive");

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
''',
)

# ─── Shared variant helpers ───────────────────────────────────────────────────
write(
    "src/lib/product-variants.ts",
    '''import { canonicalizeVariation } from './checkout-authority.ts';

export interface VariantShape {
  attributes: Record<string, string>;
  isActive?: boolean;
}

export class ProductVariantError extends Error {}

export function normalizeVariantAttributes(
  value: Record<string, string>,
): Record<string, string> {
  const normalized = Object.fromEntries(
    Object.entries(value)
      .map(([key, option]) => [key.trim(), String(option).trim()] as const)
      .filter(([key, option]) => Boolean(key && option))
      .sort(([left], [right]) => left.localeCompare(right)),
  );

  if (Object.keys(normalized).length === 0) {
    throw new ProductVariantError('Every variant needs at least one option.');
  }
  return normalized;
}

export function variantOptionKey(value: Record<string, string>): string {
  return canonicalizeVariation(normalizeVariantAttributes(value));
}

export function parseVariantAttributes(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return normalizeVariantAttributes(
      Object.fromEntries(
        Object.entries(parsed).map(([key, option]) => [key, String(option)]),
      ),
    );
  } catch {
    return {};
  }
}

export function buildVariationDefinition(variants: VariantShape[]): string {
  const options = new Map<string, Set<string>>();

  for (const variant of variants) {
    if (variant.isActive === false) continue;
    const attributes = normalizeVariantAttributes(variant.attributes);
    for (const [key, option] of Object.entries(attributes)) {
      const values = options.get(key) || new Set<string>();
      values.add(option);
      options.set(key, values);
    }
  }

  return JSON.stringify(
    Object.fromEntries(
      [...options.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, values]) => [key, [...values].sort()]),
    ),
  );
}

export function variantLabel(value: Record<string, string>): string {
  return Object.entries(normalizeVariantAttributes(value))
    .map(([key, option]) => `${key}: ${option}`)
    .join(' · ');
}
''',
)

write(
    "src/lib/product-variants.test.ts",
    '''import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildVariationDefinition,
  normalizeVariantAttributes,
  parseVariantAttributes,
  ProductVariantError,
  variantOptionKey,
} from './product-variants.ts';

test('variant attributes are normalized into a stable unique key', () => {
  const normalized = normalizeVariantAttributes({ size: ' M ', color: 'Black' });
  assert.deepEqual(normalized, { color: 'Black', size: 'M' });
  assert.equal(variantOptionKey(normalized), '{"color":"Black","size":"M"}');
});

test('empty variant attributes are rejected', () => {
  assert.throws(
    () => normalizeVariantAttributes({ color: '  ' }),
    ProductVariantError,
  );
});

test('variation definitions include only active SKU options', () => {
  const definition = buildVariationDefinition([
    { attributes: { color: 'Black', size: 'M' }, isActive: true },
    { attributes: { color: 'White', size: 'L' }, isActive: true },
    { attributes: { color: 'Purple', size: 'XL' }, isActive: false },
  ]);
  assert.equal(
    definition,
    '{"color":["Black","White"],"size":["L","M"]}',
  );
  assert.deepEqual(parseVariantAttributes('{"size":"M","color":"Black"}'), {
    color: 'Black',
    size: 'M',
  });
});
''',
)

# ─── Seed first-class variants for every configured demo product ──────────────
replace_once(
    "prisma/seed.ts",
    'const db = new PrismaClient();\n',
    '''const db = new PrismaClient();

function canonicalSeedAttributes(attributes: Record<string, string>): string {
\treturn JSON.stringify(
\t\tObject.fromEntries(
\t\t\tObject.entries(attributes).sort(([left], [right]) =>
\t\t\t\tleft.localeCompare(right),
\t\t\t),
\t\t),
\t);
}

function expandSeedOptions(raw: string): Record<string, string>[] {
\tlet parsed: Record<string, string[]> = {};
\ttry {
\t\tconst value = JSON.parse(raw) as unknown;
\t\tif (value && typeof value === "object" && !Array.isArray(value)) {
\t\t\tparsed = Object.fromEntries(
\t\t\t\tObject.entries(value)
\t\t\t\t\t.filter(([, options]) => Array.isArray(options))
\t\t\t\t\t.map(([key, options]) => [
\t\t\t\t\t\tkey,
\t\t\t\t\t\t(options as unknown[])
\t\t\t\t\t\t\t.filter((option): option is string => typeof option === "string")
\t\t\t\t\t\t\t.map((option) => option.trim())
\t\t\t\t\t\t\t.filter(Boolean),
\t\t\t\t\t]),
\t\t\t);
\t\t}
\t} catch {
\t\treturn [];
\t}

\tconst entries = Object.entries(parsed)
\t\t.filter(([, options]) => options.length > 0)
\t\t.sort(([left], [right]) => left.localeCompare(right));
\tif (entries.length === 0) return [];

\treturn entries.reduce<Record<string, string>[]>(
\t\t(combinations, [key, options]) =>
\t\t\tcombinations.flatMap((combination) =>
\t\t\t\toptions.map((option) => ({ ...combination, [key]: option })),
\t\t\t),
\t\t[{}],
\t);
}

function seedSkuPart(value: string): string {
\treturn value
\t\t.toUpperCase()
\t\t.replace(/[^A-Z0-9]+/g, "-")
\t\t.replace(/^-+|-+$/g, "")
\t\t.slice(0, 16) || "OPTION";
}
''',
)
replace_once(
    "prisma/seed.ts",
    "\tawait db.orderItem.deleteMany({});\n\tawait db.order.deleteMany({});",
    "\tawait db.orderItem.deleteMany({});\n\tawait db.productVariant.deleteMany({});\n\tawait db.order.deleteMany({});",
)
replace_once(
    "prisma/seed.ts",
    '''\tconst allProducts = await db.product.findMany({
\t\torderBy: { createdAt: "asc" },
\t});

\t// ─── ORDERS ───────────────────────────────────────────────────────────────────
''',
    '''\tconst allProducts = await db.product.findMany({
\t\torderBy: { createdAt: "asc" },
\t});

\t// ─── PRODUCT VARIANTS / SKUS ─────────────────────────────────────────────────
\tconst variantRows = allProducts.flatMap((product) => {
\t\tconst combinations = expandSeedOptions(product.variations);
\t\tif (combinations.length === 0) return [];

\t\tconst evenStock = Math.floor(product.stock / combinations.length);
\t\tconst remainder = product.stock % combinations.length;
\t\treturn combinations.map((attributes, index) => {
\t\t\tconst optionKey = canonicalSeedAttributes(attributes);
\t\t\tconst suffix = Object.values(attributes).map(seedSkuPart).join("-");
\t\t\treturn {
\t\t\t\tproductId: product.id,
\t\t\t\tsku: `${product.sku || product.id}-${suffix}`.slice(0, 96),
\t\t\t\tattributes: optionKey,
\t\t\t\toptionKey,
\t\t\t\tprice: product.price,
\t\t\t\toriginalPrice: product.originalPrice,
\t\t\t\tstock: evenStock + (index < remainder ? 1 : 0),
\t\t\t\tisActive: true,
\t\t\t};
\t\t});
\t});
\tif (variantRows.length > 0) {
\t\tawait db.productVariant.createMany({ data: variantRows });
\t}

\t// ─── ORDERS ───────────────────────────────────────────────────────────────────
''',
)
replace_once(
    "prisma/seed.ts",
    "\t\tproducts: await db.product.count(),\n\t\torders: await db.order.count(),",
    "\t\tproducts: await db.product.count(),\n\t\tproductVariants: await db.productVariant.count(),\n\t\torders: await db.order.count(),",
)

# ─── Public product projections ───────────────────────────────────────────────
write(
    "src/app/api/products/route.ts",
    '''import { Prisma } from '@prisma/client';
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
''',
)

write(
    "src/app/api/products/[id]/route.ts",
    '''import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

const publicStoreSelect = {
  id: true,
  name: true,
  nameAr: true,
  rating: true,
  isVerified: true,
  location: true,
  productCount: true,
} as const;

const publicCategorySelect = {
  id: true,
  name: true,
  nameAr: true,
  slug: true,
} as const;

const cardSelect = {
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
  category: { select: publicCategorySelect },
  store: { select: publicStoreSelect },
} satisfies Prisma.ProductSelect;

function mapCard(product: Prisma.ProductGetPayload<{ select: typeof cardSelect }>) {
  return {
    ...product,
    price: Number(product.price),
    originalPrice:
      product.originalPrice === null ? null : Number(product.originalPrice),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await db.product.findFirst({
      where: { id, status: 'active' },
      select: {
        ...cardSelect,
        variantSkus: {
          where: { isActive: true },
          orderBy: [{ price: 'asc' }, { sku: 'asc' }],
          select: {
            id: true,
            sku: true,
            attributes: true,
            optionKey: true,
            price: true,
            originalPrice: true,
            stock: true,
            isActive: true,
          },
        },
      },
    });

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const [similarProducts, relatedProducts] = await Promise.all([
      db.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
          status: 'active',
        },
        take: 8,
        select: cardSelect,
      }),
      db.product.findMany({
        where: {
          categoryId: { not: product.categoryId },
          id: { not: product.id },
          status: 'active',
        },
        take: 4,
        select: cardSelect,
      }),
    ]);

    return Response.json({
      product: {
        ...mapCard(product),
        variantSkus: product.variantSkus.map((variant) => ({
          ...variant,
          price: Number(variant.price),
          originalPrice:
            variant.originalPrice === null
              ? null
              : Number(variant.originalPrice),
        })),
      },
      similarProducts: similarProducts.map(mapCard),
      relatedProducts: relatedProducts.map(mapCard),
    });
  } catch (error) {
    console.error('Product detail API error:', error);
    return Response.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
''',
)

# ─── Authenticated seller product and SKU persistence ─────────────────────────
write(
    "src/app/api/seller/products/route.ts",
    '''import { Prisma } from '@prisma/client';
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
''',
)

# ─── Variant-aware checkout ───────────────────────────────────────────────────
write(
    "src/app/api/checkout/route.ts",
    '''import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  allocateCents,
  calculateStoreShippingCents,
  calculateStoreTaxCents,
  fromCents,
  resolveTaxCountryCode,
  toCents,
  validateVariationSelection,
  VariationValidationError,
} from '@/lib/checkout-authority';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
} from '@/lib/security';

const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        variantId: z.string().min(1).max(64).optional(),
        quantity: z.number().int().min(1).max(100),
        variation: z
          .union([z.string(), z.record(z.string(), z.string())])
          .optional(),
      }),
    )
    .min(1)
    .max(100),
  shippingMethod: z.enum(['standard', 'express', 'next_day']),
  paymentMethod: z.enum(['cash_on_delivery', 'wallet']),
  couponCode: z.string().trim().max(50).optional(),
  addressId: z.string().min(1).max(64).optional(),
  address: z
    .object({
      name: z.string().trim().min(2).max(100),
      phone: z.string().trim().min(5).max(30),
      address1: z.string().trim().min(3).max(200),
      address2: z.string().trim().max(200).optional(),
      city: z.string().trim().min(2).max(100),
      state: z.string().trim().max(100).optional(),
      postalCode: z.string().trim().max(30).optional(),
      country: z.string().trim().min(2).max(100),
    })
    .optional(),
  notes: z.string().trim().max(500).optional(),
});

class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function makeOrderNumber(index: number): string {
  const entropy = crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();
  return `NXM-${Date.now().toString(36).toUpperCase()}-${index + 1}-${entropy}`;
}

function makeInvoiceNumber(index: number): string {
  const entropy = crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  return `INV-${Date.now().toString(36).toUpperCase()}-${index + 1}-${entropy}`;
}

async function existingCheckout(userId: string, idempotencyKey: string) {
  const orders = await db.order.findMany({
    where: { userId, idempotencyKey },
    select: { orderNumber: true, total: true, paymentStatus: true },
    orderBy: { createdAt: 'asc' },
  });

  if (orders.length === 0) return null;
  return {
    success: true,
    idempotentReplay: true,
    orderNumbers: orders.map((order) => order.orderNumber),
    total: orders.reduce((sum, order) => sum + Number(order.total), 0),
    paymentStatus: orders.every((order) => order.paymentStatus === 'paid')
      ? 'paid'
      : 'pending',
  };
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'The checkout information is incomplete or invalid.' },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const replay = await existingCheckout(auth.user.id, input.idempotencyKey);
  if (replay) return NextResponse.json(replay);

  try {
    const result = await db.$transaction(
      async (tx) => {
        let shippingAddress: Record<string, unknown>;
        let shippingCountry: string;

        if (input.addressId) {
          const address = await tx.address.findFirst({
            where: { id: input.addressId, userId: auth.user.id },
          });
          if (!address) {
            throw new CheckoutError('Shipping address was not found.', 404);
          }
          shippingCountry = address.country;
          shippingAddress = {
            id: address.id,
            name: address.fullName,
            phone: address.phone,
            address1: address.address1,
            address2: address.address2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          };
        } else if (input.address) {
          shippingCountry = input.address.country;
          shippingAddress = input.address;
        } else {
          throw new CheckoutError('A shipping address is required.');
        }

        const taxCountryCode = resolveTaxCountryCode(shippingCountry);
        if (!taxCountryCode) {
          throw new CheckoutError(
            'The selected shipping country is not supported for checkout.',
            400,
          );
        }
        shippingAddress = { ...shippingAddress, countryCode: taxCountryCode };

        const productIds = [...new Set(input.items.map((item) => item.productId))];
        const products = await tx.product.findMany({
          where: { id: { in: productIds }, status: 'active' },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            storeId: true,
            variations: true,
            hasFreeShipping: true,
            category: { select: { id: true, slug: true, name: true } },
            store: { select: { ownerId: true, name: true } },
            variantSkus: {
              where: { isActive: true },
              select: {
                id: true,
                sku: true,
                attributes: true,
                optionKey: true,
                price: true,
                stock: true,
              },
            },
          },
        });
        const productsById = new Map(products.map((product) => [product.id, product]));
        if (products.length !== productIds.length) {
          throw new CheckoutError('One or more products are no longer available.', 409);
        }

        const requested = new Map<string, {
          productId: string;
          variantId: string | null;
          quantity: number;
          variation: string | null;
        }>();

        for (const item of input.items) {
          const product = productsById.get(item.productId);
          if (!product) throw new CheckoutError('Product not found.', 404);

          let canonicalSelection: string | null = null;
          try {
            canonicalSelection = validateVariationSelection(
              product.variations,
              item.variation,
            ).canonical;
          } catch (error) {
            if (error instanceof VariationValidationError) {
              throw new CheckoutError(`${product.name}: ${error.message}`, 409);
            }
            throw error;
          }

          let variant: (typeof product.variantSkus)[number] | null = null;
          if (product.variantSkus.length > 0) {
            variant = item.variantId
              ? product.variantSkus.find((candidate) => candidate.id === item.variantId) || null
              : product.variantSkus.find((candidate) => candidate.optionKey === canonicalSelection) || null;
            if (!variant) {
              throw new CheckoutError(
                `${product.name}: the selected SKU is no longer available.`,
                409,
              );
            }
            if (canonicalSelection && variant.optionKey !== canonicalSelection) {
              throw new CheckoutError(
                `${product.name}: the submitted SKU does not match the selected options.`,
                409,
              );
            }
            canonicalSelection = variant.attributes;
          } else if (item.variantId) {
            throw new CheckoutError(`${product.name}: invalid SKU selection.`, 409);
          }

          const key = variant?.id || `${item.productId}:base`;
          const current = requested.get(key);
          requested.set(key, {
            productId: item.productId,
            variantId: variant?.id || null,
            variation: canonicalSelection,
            quantity: (current?.quantity || 0) + item.quantity,
          });
        }

        const prepared = [...requested.values()].map((item) => {
          const product = productsById.get(item.productId);
          if (!product) throw new CheckoutError('Product not found.', 404);
          const variant = item.variantId
            ? product.variantSkus.find((candidate) => candidate.id === item.variantId) || null
            : null;
          const unitPrice = toCents(Number(variant?.price ?? product.price));
          return {
            ...item,
            product,
            variant,
            unitPrice,
            availableStock: variant?.stock ?? product.stock,
            lineTotal: unitPrice * item.quantity,
          };
        });

        const quantitiesByProduct = new Map<string, number>();
        const quantitiesByVariant = new Map<string, { quantity: number; name: string }>();
        for (const item of prepared) {
          quantitiesByProduct.set(
            item.product.id,
            (quantitiesByProduct.get(item.product.id) || 0) + item.quantity,
          );
          if (item.variant) {
            const current = quantitiesByVariant.get(item.variant.id);
            quantitiesByVariant.set(item.variant.id, {
              quantity: (current?.quantity || 0) + item.quantity,
              name: `${item.product.name} (${item.variant.sku})`,
            });
          }
          if (item.availableStock < item.quantity) {
            throw new CheckoutError(
              `${item.product.name} does not have enough stock for this SKU.`,
              409,
            );
          }
        }

        const groups = new Map<string, typeof prepared>();
        for (const item of prepared) {
          const group = groups.get(item.product.storeId) || [];
          group.push(item);
          groups.set(item.product.storeId, group);
        }
        const stores = [...groups.entries()];
        const subtotals = stores.map(([, items]) =>
          items.reduce((sum, item) => sum + item.lineTotal, 0),
        );
        const checkoutSubtotal = subtotals.reduce((sum, value) => sum + value, 0);

        let couponDiscount = 0;
        let couponId: string | null = null;
        let eligibleStoreId: string | null = null;
        if (input.couponCode) {
          const coupon = await tx.coupon.findUnique({
            where: { code: input.couponCode.toUpperCase() },
          });
          const now = new Date();
          if (
            !coupon ||
            !coupon.isActive ||
            (coupon.expiresAt && coupon.expiresAt <= now) ||
            (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
          ) {
            throw new CheckoutError('This coupon is invalid or has expired.');
          }
          eligibleStoreId = coupon.storeId;
          const eligibleSubtotal = coupon.storeId
            ? stores.reduce(
                (sum, [storeId], index) =>
                  storeId === coupon.storeId ? sum + subtotals[index] : sum,
                0,
              )
            : checkoutSubtotal;
          if (eligibleSubtotal < toCents(Number(coupon.minOrder))) {
            throw new CheckoutError('The order does not meet this coupon minimum.');
          }
          couponDiscount = coupon.type === 'fixed'
            ? toCents(Number(coupon.discount))
            : Math.round((eligibleSubtotal * Number(coupon.discount)) / 100);
          if (coupon.maxDiscount !== null) {
            couponDiscount = Math.min(couponDiscount, toCents(Number(coupon.maxDiscount)));
          }
          couponDiscount = Math.min(couponDiscount, eligibleSubtotal);
          couponId = coupon.id;
        }

        const eligibleWeights = stores.map(([storeId], index) =>
          !eligibleStoreId || storeId === eligibleStoreId ? subtotals[index] : 0,
        );
        const discounts = allocateCents(couponDiscount, eligibleWeights);
        const shippingAllocations = stores.map(([, items], index) =>
          calculateStoreShippingCents(
            input.shippingMethod,
            subtotals[index],
            items.map((item) => ({ hasFreeShipping: item.product.hasFreeShipping })),
          ),
        );
        const taxes = stores.map(([, items], index) =>
          calculateStoreTaxCents(
            taxCountryCode,
            items.map((item) => ({
              lineTotalCents: item.lineTotal,
              categoryId: item.product.category.id,
              categorySlug: item.product.category.slug,
              categoryName: item.product.category.name,
            })),
            discounts[index],
          ),
        );
        const totals = subtotals.map(
          (subtotal, index) =>
            subtotal + shippingAllocations[index] - discounts[index] + taxes[index],
        );
        const checkoutTotal = totals.reduce((sum, value) => sum + value, 0);

        if (input.paymentMethod === 'wallet') {
          const walletUpdate = await tx.user.updateMany({
            where: {
              id: auth.user.id,
              walletBalance: { gte: fromCents(checkoutTotal) },
            },
            data: { walletBalance: { decrement: fromCents(checkoutTotal) } },
          });
          if (walletUpdate.count !== 1) {
            throw new CheckoutError('Your wallet balance is insufficient.', 409);
          }
        }

        for (const [variantId, reservation] of quantitiesByVariant) {
          const updated = await tx.productVariant.updateMany({
            where: { id: variantId, isActive: true, stock: { gte: reservation.quantity } },
            data: { stock: { decrement: reservation.quantity } },
          });
          if (updated.count !== 1) {
            throw new CheckoutError(`${reservation.name} changed while ordering.`, 409);
          }
        }
        for (const [productId, quantity] of quantitiesByProduct) {
          const product = productsById.get(productId);
          const updated = await tx.product.updateMany({
            where: { id: productId, status: 'active', stock: { gte: quantity } },
            data: {
              stock: { decrement: quantity },
              soldCount: { increment: quantity },
            },
          });
          if (updated.count !== 1) {
            throw new CheckoutError(
              `${product?.name || 'Product'} changed while the order was being placed.`,
              409,
            );
          }
        }

        if (couponId) {
          await tx.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } },
          });
        }

        const orderNumbers: string[] = [];
        for (let index = 0; index < stores.length; index += 1) {
          const [storeId, items] = stores[index];
          const orderNumber = makeOrderNumber(index);
          const invoiceNumber = makeInvoiceNumber(index);
          const paymentStatus = input.paymentMethod === 'wallet' ? 'paid' : 'pending';
          const order = await tx.order.create({
            data: {
              orderNumber,
              idempotencyKey: input.idempotencyKey,
              userId: auth.user.id,
              storeId,
              status: 'pending',
              subtotal: fromCents(subtotals[index]),
              shippingCost: fromCents(shippingAllocations[index]),
              discount: fromCents(discounts[index]),
              tax: fromCents(taxes[index]),
              total: fromCents(totals[index]),
              paymentMethod: input.paymentMethod,
              paymentStatus,
              shippingAddress: JSON.stringify(shippingAddress),
              notes: input.notes || null,
              items: {
                create: items.map((item) => ({
                  productId: item.product.id,
                  variantId: item.variant?.id || null,
                  quantity: item.quantity,
                  price: fromCents(item.unitPrice),
                  total: fromCents(item.lineTotal),
                  variation: item.variation,
                })),
              },
            },
          });
          await tx.invoice.create({
            data: {
              orderId: order.id,
              invoiceNumber,
              sellerId: items[0].product.store.ownerId,
              buyerId: auth.user.id,
              subtotal: fromCents(subtotals[index]),
              shipping: fromCents(shippingAllocations[index]),
              discount: fromCents(discounts[index]),
              tax: fromCents(taxes[index]),
              total: fromCents(totals[index]),
              paymentMethod: input.paymentMethod,
              status: paymentStatus === 'paid' ? 'paid' : 'unpaid',
            },
          });
          orderNumbers.push(orderNumber);
        }

        await tx.notification.create({
          data: {
            userId: auth.user.id,
            title: 'Order placed',
            titleAr: 'تم إنشاء الطلب',
            message: `Your order ${orderNumbers.join(', ')} was placed successfully.`,
            messageAr: `تم إنشاء طلبك ${orderNumbers.join('، ')} بنجاح.`,
            type: 'order',
          },
        });

        return {
          success: true,
          idempotentReplay: false,
          orderNumbers,
          total: fromCents(checkoutTotal),
          subtotal: fromCents(checkoutSubtotal),
          shipping: fromCents(shippingAllocations.reduce((sum, value) => sum + value, 0)),
          discount: fromCents(couponDiscount),
          tax: fromCents(taxes.reduce((sum, value) => sum + value, 0)),
          taxCountryCode,
          shipments: stores.map(([storeId], index) => ({
            storeId,
            subtotal: fromCents(subtotals[index]),
            shipping: fromCents(shippingAllocations[index]),
            discount: fromCents(discounts[index]),
            tax: fromCents(taxes[index]),
            total: fromCents(totals[index]),
          })),
          paymentStatus: input.paymentMethod === 'wallet' ? 'paid' as const : 'pending' as const,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 15_000,
      },
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const replayAfterRace = await existingCheckout(auth.user.id, input.idempotencyKey);
      if (replayAfterRace) return NextResponse.json(replayAfterRace);
    }
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'The order could not be completed. No partial order was saved.' },
      { status: 500 },
    );
  }
}
''',
)

# Include immutable SKU snapshot metadata in order reads.
replace_once(
    "src/app/api/orders/route.ts",
    '''              product: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                  images: true,
                },
              },
''',
    '''              product: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                  images: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  sku: true,
                  attributes: true,
                },
              },
''',
)

print("Product variant backend changes applied successfully.")
