import { Prisma } from '@prisma/client';
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
