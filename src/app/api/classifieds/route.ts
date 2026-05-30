import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const condition = searchParams.get('condition');
    const city = searchParams.get('city');
    const q = searchParams.get('q');

    const where: Record<string, unknown> = { status: 'active' };

    if (categoryId) where.categoryId = categoryId;
    if (condition && condition !== 'all') where.condition = condition;
    if (city) where.city = { contains: city };

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { city: { contains: q } },
      ];
    }

    const classifieds = await db.classified.findMany({
      where,
      include: {
        category: { select: { name: true, nameAr: true } },
        seller: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = classifieds.map((c) => ({
      id: c.id,
      title: c.title,
      titleAr: c.titleAr,
      description: c.description || '',
      descriptionAr: c.descriptionAr || '',
      price: c.price,
      condition: c.condition,
      category: c.category.name,
      categoryAr: c.category.nameAr,
      location: c.city || '',
      locationAr: '',
      phone: c.contactPhone || '',
      images: c.images ? JSON.parse(c.images) : [],
      sellerName: c.seller?.name || '',
      sellerNameAr: '',
      createdAt: c.createdAt.toISOString(),
      views: c.views,
      isFeatured: c.isFeatured,
    }));

    return NextResponse.json({ classifieds: mapped, total: mapped.length });
  } catch (error) {
    console.error('Classifieds API error:', error);
    return NextResponse.json({ error: 'Failed to fetch classifieds' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { title, titleAr, description, descriptionAr, price, categoryId, condition, city, country, images, contactPhone, sellerId } = body;

    if (!title || price === undefined || !categoryId || !sellerId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, price, categoryId, sellerId' },
        { status: 400 }
      );
    }

    const classified = await db.classified.create({
      data: {
        title,
        titleAr: titleAr || null,
        description: description || null,
        descriptionAr: descriptionAr || null,
        price: parseFloat(price),
        categoryId,
        condition: condition || 'used',
        city: city || null,
        country: country || null,
        images: images ? JSON.stringify(images) : '[]',
        contactPhone: contactPhone || null,
        sellerId,
        status: 'active',
        isFeatured: false,
        views: 0,
      },
      include: {
        category: { select: { name: true, nameAr: true } },
        seller: { select: { name: true } },
      },
    });

    const ad = {
      id: classified.id,
      title: classified.title,
      titleAr: classified.titleAr,
      description: classified.description || '',
      descriptionAr: classified.descriptionAr || '',
      price: classified.price,
      condition: classified.condition,
      category: classified.category.name,
      categoryAr: classified.category.nameAr,
      location: classified.city || '',
      locationAr: '',
      phone: classified.contactPhone || '',
      images: classified.images ? JSON.parse(classified.images) : [],
      sellerName: classified.seller?.name || '',
      sellerNameAr: '',
      createdAt: classified.createdAt.toISOString(),
      views: classified.views,
      isFeatured: classified.isFeatured,
    };

    return NextResponse.json({ success: true, ad }, { status: 201 });
  } catch (error) {
    console.error('Classifieds POST error:', error);
    return NextResponse.json({ error: 'Failed to create classified' }, { status: 500 });
  }
}
