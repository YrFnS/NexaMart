import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');

    // Get products on sale from database
    const products = await db.product.findMany({
      where: {
        isSale: true,
        status: 'active',
        originalPrice: { not: null },
      },
      include: {
        category: true,
        store: true,
      },
      take: limit,
      orderBy: { soldCount: 'desc' },
    });

    // Calculate discount and format deals
    const deals = products.map(product => {
      const originalPrice = product.originalPrice || product.price;
      const discountPercent = originalPrice > 0
        ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
        : 0;

      return {
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        originalPrice,
        discountPercent,
        image: product.images ? JSON.parse(product.images)[0] || '' : '',
        rating: product.rating,
        reviewCount: product.reviewCount,
        soldCount: product.soldCount,
        stock: product.stock,
        storeName: product.store.name,
        category: product.category.name,
        categoryAr: product.category.nameAr,
        freeShipping: product.hasFreeShipping,
        isNew: product.isNew,
      };
    });

    // Pick a "deal of the day" - highest discount product
    const dealOfDay = deals.length > 0
      ? deals.reduce((best, deal) => deal.discountPercent > best.discountPercent ? deal : best, deals[0])
      : null;

    return Response.json({
      deals,
      total: deals.length,
      dealOfDay,
    });
  } catch (error) {
    console.error('Deals API error:', error);
    return Response.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}
