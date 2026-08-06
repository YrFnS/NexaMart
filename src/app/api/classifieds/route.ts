import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
  validatePagination,
  validateSearchParam,
} from '@/lib/security';

const CONDITIONS = ['new', 'used', 'refurbished'] as const;

const createSchema = z.object({
  title: z.string().trim().min(3).max(150),
  titleAr: z.string().trim().max(150).optional().nullable(),
  description: z.string().trim().max(5_000).optional().nullable(),
  descriptionAr: z.string().trim().max(5_000).optional().nullable(),
  price: z.coerce.number().finite().min(0).max(1_000_000_000),
  categoryId: z.string().min(1).max(64),
  condition: z.enum(CONDITIONS).default('used'),
  city: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  images: z.array(z.string().trim().max(2_000)).max(12).default([]),
  contactPhone: z.string().trim().max(30).optional().nullable(),
});

function parseImages(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((image): image is string => typeof image === 'string').slice(0, 12)
      : [];
  } catch {
    return [];
  }
}

const classifiedInclude = {
  category: { select: { name: true, nameAr: true } },
  seller: { select: { name: true } },
} satisfies Prisma.ClassifiedInclude;

type ClassifiedWithRelations = Prisma.ClassifiedGetPayload<{
  include: typeof classifiedInclude;
}>;

function mapClassified(classified: ClassifiedWithRelations) {
  return {
    id: classified.id,
    title: classified.title,
    titleAr: classified.titleAr,
    description: classified.description || '',
    descriptionAr: classified.descriptionAr || '',
    price: Number(classified.price),
    condition: classified.condition,
    category: classified.category.name,
    categoryAr: classified.category.nameAr,
    location: classified.city || '',
    locationAr: '',
    phone: classified.contactPhone || '',
    images: parseImages(classified.images),
    sellerName: classified.seller.name || '',
    sellerNameAr: '',
    createdAt: classified.createdAt.toISOString(),
    views: classified.views,
    isFeatured: classified.isFeatured,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const condition = searchParams.get('condition');
    const city = validateSearchParam(searchParams.get('city') || '', 100);
    const query = validateSearchParam(searchParams.get('q') || '', 150);
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      50,
    );

    if (
      condition &&
      condition !== 'all' &&
      !CONDITIONS.includes(condition as (typeof CONDITIONS)[number])
    ) {
      return NextResponse.json({ error: 'Invalid classified condition.' }, { status: 400 });
    }

    const where: Prisma.ClassifiedWhereInput = {
      status: 'active',
      ...(categoryId ? { categoryId } : {}),
      ...(condition && condition !== 'all' ? { condition } : {}),
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { titleAr: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [classifieds, total] = await db.$transaction([
      db.classified.findMany({
        where,
        include: classifiedInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.classified.count({ where }),
    ]);

    return NextResponse.json({
      classifieds: classifieds.map(mapClassified),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Classifieds GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classifieds.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid classified details.' }, { status: 400 });
  }

  try {
    const classified = await db.classified.create({
      data: {
        title: parsed.data.title,
        titleAr: parsed.data.titleAr || null,
        description: parsed.data.description || null,
        descriptionAr: parsed.data.descriptionAr || null,
        price: parsed.data.price,
        categoryId: parsed.data.categoryId,
        condition: parsed.data.condition,
        city: parsed.data.city || null,
        country: parsed.data.country || null,
        images: JSON.stringify(parsed.data.images),
        contactPhone: parsed.data.contactPhone || auth.user.phone || null,
        sellerId: auth.user.id,
        status: 'active',
        isFeatured: false,
        views: 0,
      },
      include: classifiedInclude,
    });

    return NextResponse.json(
      { success: true, ad: mapClassified(classified) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }
    console.error('Classifieds POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create classified.' },
      { status: 500 },
    );
  }
}
