import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { validateAdminRequest } from '@/lib/security';

const positions = ['hero', 'sidebar', 'footer', 'popup', 'category'] as const;
const bannerSchema = z.object({
  title: z.string().trim().min(1).max(150),
  titleAr: z.string().trim().max(150).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  descriptionAr: z.string().trim().max(500).optional().nullable(),
  image: z.string().trim().max(2000).optional().nullable(),
  link: z.string().trim().max(2000).optional().nullable(),
  ctaText: z.string().trim().max(80).optional().nullable(),
  ctaTextAr: z.string().trim().max(80).optional().nullable(),
  ctaLink: z.string().trim().max(2000).optional().nullable(),
  gradient: z.string().trim().max(300).optional().nullable(),
  icon: z.string().trim().max(80).optional().nullable(),
  position: z.enum(positions).default('hero'),
  sortOrder: z.number().int().min(-10000).max(10000).default(0),
  isActive: z.boolean().default(true),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

function datesAreValid(startDate?: Date | null, endDate?: Date | null) {
  return !startDate || !endDate || startDate <= endDate;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || 'hero';
    if (!positions.includes(position as (typeof positions)[number])) {
      return NextResponse.json({ error: 'Invalid banner position.' }, { status: 400 });
    }

    const now = new Date();
    const activeOnly = searchParams.get('isActive') !== 'false';
    const banners = await db.banner.findMany({
      where: {
        position,
        ...(activeOnly
          ? {
              isActive: true,
              AND: [
                { OR: [{ startDate: null }, { startDate: { lte: now } }] },
                { OR: [{ endDate: null }, { endDate: { gte: now } }] },
              ],
            }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });

    return NextResponse.json({ banners, total: banners.length });
  } catch (error) {
    console.error('Banners GET error:', error);
    return NextResponse.json({ banners: [], total: 0 }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  const parsed = bannerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !datesAreValid(parsed.data?.startDate, parsed.data?.endDate)) {
    return NextResponse.json({ error: 'Invalid banner details.' }, { status: 400 });
  }

  try {
    const banner = await db.banner.create({ data: parsed.data });
    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (error) {
    console.error('Banners POST error:', error);
    return NextResponse.json({ error: 'Failed to create banner.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = bannerSchema.partial().extend({ id: z.string().min(1).max(64) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid banner update.' }, { status: 400 });
  }

  try {
    const { id, ...changes } = parsed.data;
    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Banner not found.' }, { status: 404 });

    const startDate = changes.startDate === undefined ? existing.startDate : changes.startDate;
    const endDate = changes.endDate === undefined ? existing.endDate : changes.endDate;
    if (!datesAreValid(startDate, endDate)) {
      return NextResponse.json({ error: 'Invalid banner date range.' }, { status: 400 });
    }

    const banner = await db.banner.update({ where: { id }, data: changes });
    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error('Banners PUT error:', error);
    return NextResponse.json({ error: 'Failed to update banner.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Banner id is required.' }, { status: 400 });

  try {
    const deleted = await db.banner.deleteMany({ where: { id } });
    if (deleted.count !== 1) {
      return NextResponse.json({ error: 'Banner not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Banners DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete banner.' }, { status: 500 });
  }
}
