import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MENA_CITIES_EXTENDED } from '@/lib/reference-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const category = searchParams.get('category');

    // Build query for products from DB filtered by city
    const where: Record<string, unknown> = { status: 'active' };

    // City-based filtering: since Product model doesn't have a city field directly,
    // we filter by the store's products. For now, just return all active products.
    // City filtering would require a more complex relationship.

    if (category && category !== 'all') {
      where.category = { slug: category };
    }

    // If city is specified, we could use it for future geo-filtering
    // For now, get all active products with store info
    const products = await db.product.findMany({
      where,
      include: {
        category: { select: { name: true, nameAr: true, slug: true } },
        store: { select: { name: true, nameAr: true, isVerified: true, rating: true } },
      },
      take: 20,
      orderBy: { soldCount: 'desc' },
    });

    const mapped = products.map((p) => ({
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
      image: p.images ? JSON.parse(p.images)[0] || '' : '',
      price: p.price,
      originalPrice: p.originalPrice || undefined,
      category: p.category.name,
      categoryAr: p.category.nameAr,
      sellerName: p.store.name,
      sellerNameAr: p.store.nameAr || '',
      sellerLocation: '',
      sellerLocationAr: '',
      rating: p.store.rating,
      reviewCount: p.reviewCount,
      verified: p.store.isVerified,
      hasFreeShipping: p.hasFreeShipping,
    }));

    // Accept lat/lng from query params, fall back to Riyadh if not provided
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    let userLat = 24.7136; // Default: Riyadh
    let userLng = 46.6753;

    if (latParam && lngParam) {
      const parsedLat = parseFloat(latParam);
      const parsedLng = parseFloat(lngParam);
      // Validate lat/lng ranges
      if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        userLat = parsedLat;
        userLng = parsedLng;
      }
    }

    return NextResponse.json({
      products: mapped,
      total: mapped.length,
      cities: MENA_CITIES_EXTENDED,
      userLocation: { lat: userLat, lng: userLng },
      radius: 25,
    });
  } catch (error) {
    console.error('Near-me API error:', error);
    return NextResponse.json({ error: 'Failed to fetch nearby products' }, { status: 500 });
  }
}
