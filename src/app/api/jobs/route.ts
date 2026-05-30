import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'jobs';

    if (tab === 'services') {
      const serviceWhere: Record<string, unknown> = { status: 'active' };

      const serviceCategory = searchParams.get('category');
      if (serviceCategory && serviceCategory !== 'all') serviceWhere.category = serviceCategory;

      const location = searchParams.get('location');
      if (location && location !== 'all') serviceWhere.city = { contains: location };

      const dbServices = await db.service.findMany({
        where: serviceWhere,
        orderBy: { rating: 'desc' },
      });

      const services = dbServices.map((s) => ({
        id: s.id,
        provider: s.providerName || '',
        providerAr: '',
        category: s.category || '',
        categoryAr: '',
        rating: s.rating,
        reviewCount: s.reviewCount,
        price: s.price,
        priceUnit: s.priceUnit,
        location: s.city || '',
        locationAr: '',
        verified: s.isVerified,
        description: s.description || '',
        descriptionAr: s.descriptionAr || '',
        availableToday: s.isAvailableToday,
      }));

      return NextResponse.json({ services, total: services.length });
    }

    // Default: jobs
    const where: Record<string, unknown> = { status: 'active' };

    const type = searchParams.get('type');
    if (type && type !== 'all') where.type = type;

    const category = searchParams.get('category');
    if (category && category !== 'all') where.category = category;

    const location = searchParams.get('location');
    if (location && location !== 'all') where.location = { contains: location };

    const experienceLevel = searchParams.get('experienceLevel');
    if (experienceLevel && experienceLevel !== 'all') where.experienceLevel = experienceLevel;

    const salaryMin = searchParams.get('salaryMin');
    const salaryMax = searchParams.get('salaryMax');
    if (salaryMin) {
      where.salaryMax = { gte: Number(salaryMin) };
    }
    if (salaryMax) {
      where.salaryMin = { lte: Number(salaryMax) };
    }

    const q = searchParams.get('q');
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { company: { contains: q } },
        { description: { contains: q } },
        { location: { contains: q } },
      ];
    }

    const jobs = await db.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const mapped = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      titleAr: j.titleAr,
      company: j.company,
      companyAr: '',
      location: j.location || j.city || '',
      locationAr: '',
      salaryMin: j.salaryMin || 0,
      salaryMax: j.salaryMax || 0,
      currency: j.currency,
      type: j.type,
      category: j.category || '',
      categoryAr: '',
      postedDays: Math.floor((Date.now() - j.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      verified: j.isFeatured,
      description: j.description || '',
      descriptionAr: j.descriptionAr || '',
      skills: j.skills ? JSON.parse(j.skills) : [],
      experienceLevel: j.experienceLevel,
    }));

    return NextResponse.json({ jobs: mapped, total: mapped.length });
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
