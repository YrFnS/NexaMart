import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateAdminRequest,
  validateCsrf,
} from '@/lib/security';

const VALID_POSITIONS = ['hero', 'sidebar', 'footer', 'popup', 'category'] as const;

type BannerPosition = (typeof VALID_POSITIONS)[number];

function cleanText(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function parsePosition(value: unknown): BannerPosition | null {
  return VALID_POSITIONS.includes(value as BannerPosition)
    ? (value as BannerPosition)
    : null;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateWriteRequest(request: Request): NextResponse | null {
  const adminError = validateAdminRequest(request);
  if (adminError) return adminError;
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin' }, { status: 403 });
  }
  return null;
}

// Public endpoint for storefront banner reads.
export async function GET(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.general);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  try {
    const { searchParams } = new URL(request.url);
    const position = parsePosition(searchParams.get('position') || 'hero') || 'hero';
    const activeOnly = searchParams.get('isActive') === 'true';
    const now = new Date();

    const where: Record<string, unknown> = { position };
    if (activeOnly) {
      where.isActive = true;
      where.OR = [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: null },
        { startDate: null, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: { gte: now } },
      ];
    }

    const banners = await db.banner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      take: 100,
    });

    const result = banners.map(banner => ({
      id: banner.id,
      title: banner.title,
      titleAr: banner.titleAr,
      description: banner.description,
      descriptionAr: banner.descriptionAr,
      image: banner.image,
      link: banner.link,
      ctaText: banner.ctaText,
      ctaTextAr: banner.ctaTextAr,
      ctaLink: banner.ctaLink,
      gradient: banner.gradient,
      icon: banner.icon,
      position: banner.position,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      startDate: banner.startDate?.toISOString() || null,
      endDate: banner.endDate?.toISOString() || null,
    }));

    return NextResponse.json({ banners: result, total: result.length });
  } catch (error) {
    console.error('Public banners GET error:', error);
    return NextResponse.json({ banners: [], total: 0 }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const validationError = validateWriteRequest(request);
  if (validationError) return validationError;

  try {
    const body = await request.json();
    const title = cleanText(body.title, 160);
    const position = parsePosition(body.position || 'hero');
    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }
    if (!position) {
      return NextResponse.json({ error: 'Invalid position value' }, { status: 400 });
    }

    const startDate = parseDate(body.startDate);
    const endDate = parseDate(body.endDate);
    if (body.startDate && !startDate) {
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
    }
    if (body.endDate && !endDate) {
      return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
    }
    if (startDate && endDate && endDate < startDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const banner = await db.banner.create({
      data: {
        title,
        titleAr: cleanText(body.titleAr, 160),
        description: cleanText(body.description, 1000),
        descriptionAr: cleanText(body.descriptionAr, 1000),
        image: cleanText(body.image, 2048),
        link: cleanText(body.link, 2048),
        ctaText: cleanText(body.ctaText, 80),
        ctaTextAr: cleanText(body.ctaTextAr, 80),
        ctaLink: cleanText(body.ctaLink, 2048),
        gradient: cleanText(body.gradient, 240),
        icon: cleanText(body.icon, 80),
        position,
        sortOrder: Number.isFinite(Number(body.sortOrder))
          ? Math.trunc(Number(body.sortOrder))
          : 0,
        isActive: body.isActive !== false,
        startDate,
        endDate,
      },
    });

    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (error) {
    console.error('Banners POST error:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const validationError = validateWriteRequest(request);
  if (validationError) return validationError;

  try {
    const body = await request.json();
    const id = cleanText(body.id, 80);
    if (!id) {
      return NextResponse.json({ error: 'Missing banner id' }, { status: 400 });
    }

    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) {
      const title = cleanText(body.title, 160);
      if (!title) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      updateData.title = title;
    }

    const textFields: Array<[string, number]> = [
      ['titleAr', 160],
      ['description', 1000],
      ['descriptionAr', 1000],
      ['image', 2048],
      ['link', 2048],
      ['ctaText', 80],
      ['ctaTextAr', 80],
      ['ctaLink', 2048],
      ['gradient', 240],
      ['icon', 80],
    ];
    for (const [field, maxLength] of textFields) {
      if (body[field] !== undefined) updateData[field] = cleanText(body[field], maxLength);
    }

    if (body.position !== undefined) {
      const position = parsePosition(body.position);
      if (!position) {
        return NextResponse.json({ error: 'Invalid position value' }, { status: 400 });
      }
      updateData.position = position;
    }
    if (body.sortOrder !== undefined) {
      const sortOrder = Number(body.sortOrder);
      if (!Number.isFinite(sortOrder)) {
        return NextResponse.json({ error: 'Invalid sort order' }, { status: 400 });
      }
      updateData.sortOrder = Math.trunc(sortOrder);
    }
    if (body.isActive !== undefined) updateData.isActive = body.isActive === true;

    const startDate = body.startDate !== undefined ? parseDate(body.startDate) : existing.startDate;
    const endDate = body.endDate !== undefined ? parseDate(body.endDate) : existing.endDate;
    if (body.startDate && !startDate) {
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
    }
    if (body.endDate && !endDate) {
      return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
    }
    if (startDate && endDate && endDate < startDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }
    if (body.startDate !== undefined) updateData.startDate = startDate;
    if (body.endDate !== undefined) updateData.endDate = endDate;

    const banner = await db.banner.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error('Banners PUT error:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const validationError = validateWriteRequest(request);
  if (validationError) return validationError;

  try {
    const id = cleanText(new URL(request.url).searchParams.get('id'), 80);
    if (!id) {
      return NextResponse.json({ error: 'Missing banner id' }, { status: 400 });
    }

    const existing = await db.banner.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    await db.banner.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Banners DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
