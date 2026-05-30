import { db } from '@/lib/db';

// Single Product API route
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await db.product.findUnique({
      where: { id },
      include: { category: true, store: true },
    });

    if (!product || product.status !== 'active') {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Also fetch similar products (same category, different product)
    const similarProducts = await db.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'active',
      },
      take: 8,
      include: { category: true, store: true },
    });

    // Fetch related products from other categories
    const relatedProducts = await db.product.findMany({
      where: {
        categoryId: { not: product.categoryId },
        id: { not: product.id },
        status: 'active',
      },
      take: 4,
      include: { category: true, store: true },
    });

    return Response.json({ product, similarProducts, relatedProducts });
  } catch (error) {
    console.error('Product detail API error:', error);
    return Response.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
