import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const products = await db.product.findMany({
      where: {
        isB2b: true,
        status: 'active',
        ...(category ? { category: { slug: category } } : {}),
      },
      include: {
        store: { select: { id: true, name: true, isVerified: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    const wholesale = products.map((p) => {
      let parsedTieredPricing: { min: number; max: number | null; price: number }[] = [];
      try {
        parsedTieredPricing = JSON.parse(p.tieredPricing || '[]');
      } catch {
        parsedTieredPricing = [];
      }

      return {
        id: p.id,
        title: p.name,
        titleAr: p.nameAr,
        moq: parsedTieredPricing?.[0]?.min ?? 10,
        tieredPricing: parsedTieredPricing,
        category: p.category?.slug || 'other',
        supplierName: p.store?.name || 'Unknown',
        supplierVerified: p.store?.isVerified || false,
        stock: p.stock,
      };
    });

    return Response.json({
      wholesale,
      total: wholesale.length,
    });
  } catch (error) {
    console.error('Wholesale API error:', error);
    return Response.json({ error: 'Failed to fetch wholesale products' }, { status: 500 });
  }
}
