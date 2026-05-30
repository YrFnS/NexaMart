import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CAR_MAKES } from '@/lib/reference-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const where: Record<string, unknown> = { status: 'active' };

    const make = searchParams.get('make');
    if (make && make !== 'all') where.make = make;

    const model = searchParams.get('model');
    if (model && model !== 'all') where.model = model;

    const yearFrom = searchParams.get('yearFrom');
    const yearTo = searchParams.get('yearTo');
    if (yearFrom || yearTo) {
      const yearFilter: Record<string, number> = {};
      if (yearFrom) yearFilter.gte = Number(yearFrom);
      if (yearTo) yearFilter.lte = Number(yearTo);
      where.year = yearFilter;
    }

    const fuelType = searchParams.get('fuelType');
    if (fuelType && fuelType !== 'all') where.fuelType = fuelType;

    const transmission = searchParams.get('transmission');
    if (transmission && transmission !== 'all') where.transmission = transmission;

    const bodyType = searchParams.get('bodyType');
    if (bodyType && bodyType !== 'all') where.bodyType = bodyType;

    const condition = searchParams.get('condition');
    if (condition && condition !== 'all') where.condition = condition;

    const city = searchParams.get('city');
    if (city) where.city = city;

    const priceFrom = searchParams.get('priceFrom');
    const priceTo = searchParams.get('priceTo');
    if (priceFrom || priceTo) {
      const priceFilter: Record<string, number> = {};
      if (priceFrom) priceFilter.gte = Number(priceFrom);
      if (priceTo) priceFilter.lte = Number(priceTo);
      where.price = priceFilter;
    }

    const q = searchParams.get('q');
    if (q) {
      where.OR = [
        { make: { contains: q } },
        { model: { contains: q } },
        { title: { contains: q } },
        { city: { contains: q } },
      ];
    }

    const sort = searchParams.get('sort') || 'newest';
    let orderBy: Record<string, string> = {};
    switch (sort) {
      case 'price-asc': orderBy = { price: 'asc' }; break;
      case 'price-desc': orderBy = { price: 'desc' }; break;
      case 'newest': orderBy = { year: 'desc' }; break;
      case 'mileage-asc': orderBy = { mileage: 'asc' }; break;
      default: orderBy = { createdAt: 'desc' };
    }

    const cars = await db.car.findMany({
      where,
      include: {
        seller: { select: { name: true } },
        store: { select: { name: true } },
      },
      orderBy,
    });

    const mapped = cars.map((car) => ({
      id: car.id,
      title: car.title,
      titleAr: car.titleAr,
      make: car.make,
      model: car.model,
      year: car.year,
      mileage: car.mileage || 0,
      fuelType: car.fuelType,
      transmission: car.transmission,
      bodyType: car.bodyType,
      condition: car.condition,
      color: car.color || '',
      price: car.price,
      city: car.city || '',
      images: car.images ? JSON.parse(car.images) : [],
      sellerName: car.store?.name || car.seller?.name || '',
      isFeatured: car.isFeatured,
      description: car.description || '',
      descriptionAr: car.descriptionAr || '',
      views: car.views,
      createdAt: car.createdAt.toISOString(),
    }));

    return NextResponse.json({
      cars: mapped,
      total: mapped.length,
      makes: CAR_MAKES,
    });
  } catch (error) {
    console.error('Cars API error:', error);
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 });
  }
}
