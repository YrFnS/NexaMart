import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyType = searchParams.get('type');
    const listingType = searchParams.get('listingType');
    const city = searchParams.get('city');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const isFurnished = searchParams.get('isFurnished');
    const q = searchParams.get('q');

    const where: Record<string, unknown> = { status: 'active' };

    if (propertyType && propertyType !== 'all') where.propertyType = propertyType;
    if (listingType && listingType !== 'all') where.listingType = listingType;
    if (city && city !== 'all') where.city = { contains: city };
    if (isFurnished === 'true') where.isFurnished = true;

    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.gte = Number(minPrice);
      if (maxPrice) priceFilter.lte = Number(maxPrice);
      where.price = priceFilter;
    }

    if (bedrooms && bedrooms !== 'all') {
      where.bedrooms = { gte: Number(bedrooms) };
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { city: { contains: q } },
        { address: { contains: q } },
      ];
    }

    const properties = await db.property.findMany({
      where,
      include: {
        seller: { select: { name: true } },
        store: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = properties.map((p) => ({
      id: p.id,
      title: p.title,
      titleAr: p.titleAr,
      type: p.propertyType,
      listingType: p.listingType,
      price: p.price,
      location: p.city || '',
      locationAr: '',
      bedrooms: p.bedrooms || 0,
      bathrooms: p.bathrooms || 0,
      area: p.area || 0,
      isFurnished: p.isFurnished,
      agentName: p.agentName || '',
      agentVerified: p.isVerifiedAgent,
      featured: p.isFeatured,
      views: p.views,
      images: p.images ? JSON.parse(p.images) : [],
      description: p.description || '',
      descriptionAr: p.descriptionAr || '',
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({ properties: mapped, total: mapped.length });
  } catch (error) {
    console.error('Properties API error:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}
