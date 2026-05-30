import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Reference data for categories (config data, not mock)
const SERVICE_CATEGORIES = [
  { key: 'Cleaning', label: 'Cleaning', labelAr: 'تنظيف' },
  { key: 'Maintenance', label: 'Maintenance', labelAr: 'صيانة' },
  { key: 'Education', label: 'Education', labelAr: 'تعليم' },
  { key: 'Health', label: 'Health', labelAr: 'خدمات صحية' },
  { key: 'Legal', label: 'Legal', labelAr: 'خدمات قانونية' },
  { key: 'IT & Tech', label: 'IT & Tech', labelAr: 'تقنية ومعلومات' },
  { key: 'Home Improvement', label: 'Home Improvement', labelAr: 'تحسين المنزل' },
  { key: 'Event Planning', label: 'Event Planning', labelAr: 'تخطيط فعاليات' },
  { key: 'Transport', label: 'Transport', labelAr: 'نقل' },
  { key: 'Beauty', label: 'Beauty', labelAr: 'خدمات تجميل' },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const rating = searchParams.get('rating');
    const availableToday = searchParams.get('availableToday');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const q = searchParams.get('q');

    const where: Record<string, unknown> = { status: 'active' };

    if (category && category !== 'all') where.category = category;
    if (location && location !== 'all') where.city = { contains: location };
    if (rating) where.rating = { gte: parseFloat(rating) };
    if (availableToday === 'true') where.isAvailableToday = true;

    if (priceMin || priceMax) {
      const priceFilter: Record<string, number> = {};
      if (priceMin) priceFilter.gte = parseInt(priceMin);
      if (priceMax) priceFilter.lte = parseInt(priceMax);
      where.price = priceFilter;
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { providerName: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const services = await db.service.findMany({
      where,
      orderBy: { rating: 'desc' },
    });

    const mapped = services.map((s) => ({
      id: s.id,
      provider: s.providerName || '',
      providerAr: '',
      avatar: s.providerAvatar || '',
      title: s.title,
      titleAr: s.titleAr,
      description: s.description || '',
      descriptionAr: s.descriptionAr || '',
      category: s.category || '',
      categoryAr: '',
      price: s.price,
      priceUnit: s.priceUnit,
      priceUnitAr: '',
      rating: s.rating,
      reviewCount: s.reviewCount,
      location: s.city || s.location || '',
      locationAr: '',
      verified: s.isVerified,
      availableToday: s.isAvailableToday,
    }));

    return NextResponse.json({
      services: mapped,
      total: mapped.length,
      categories: SERVICE_CATEGORIES,
    });
  } catch (error) {
    console.error('Services API error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
