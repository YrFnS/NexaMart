import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  getAdminActorId,
  sanitizeString,
  validateAdminRequest,
} from '@/lib/security';

const POSITIONS = ['hero', 'sidebar', 'footer', 'popup', 'category'] as const;

const optionalDate = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? null : value),
  z.coerce.date().nullable(),
);

const optionalLink = z
  .string()
  .trim()
  .max(2_000)
  .refine(
    (value) =>
      value === '' ||
      value.startsWith('/') ||
      /^https:\/\//i.test(value),
    'Links must be relative paths or HTTPS URLs.',
  )
  .optional()
  .nullable();

const bannerFields = z.object({
  title: z.string().trim().min(1).max(200),
  titleAr: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(2_000).optional().nullable(),
  descriptionAr: z.string().trim().max(2_000).optional().nullable(),
  image: optionalLink,
  link: optionalLink,
  ctaText: z.string().trim().max(100).optional().nullable(),
  ctaTextAr: z.string().trim().max(100).optional().nullable(),
  ctaLink: optionalLink,
  gradient: z.string().trim().max(250).optional().nullable(),
  icon: z.string().trim().max(80).optional().nullable(),
  position: z.enum(POSITIONS).default('hero'),
  sortOrder: z.coerce.number().int().min(-10_000).max(10_000).default(0),
  isActive: z.boolean().default(true),
  startDate: optionalDate.optional(),
  endDate: optionalDate.optional(),
});

const updateSchema = bannerFields.partial().extend({
  bannerId: z.string().min(1).max(64),
});

const idSchema = z.string().min(1).max(64);

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? sanitizeString(trimmed) : null;
}

function requireActor(request: Request): string | NextResponse {
  const actorId = getAdminActorId(request);
  if (actorId) return actorId;

  return NextResponse.json(
    { error: 'An administrator identity is required for audit logging.' },
    { status: 401 },
  );
}

function mapBanner(banner: {
  id: string;
  title: string;
  titleAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  image: string | null;
  link: string | null;
  ctaText: string | null;
  ctaTextAr: string | null;
  ctaLink: string | null;
  gradient: string | null;
  icon: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
}) {
  return {
    ...banner,
    startDate: banner.startDate?.toISOString() || null,
    endDate: banner.endDate?.toISOString() || null,
    createdAt: banner.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  try {
    const banners = await db.banner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      banners: banners.map(mapBanner),
      total: banners.length,
    });
  } catch (error) {
    console.error('Admin banners GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch banners.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  const actor = requireActor(request);
  if (actor instanceof NextResponse) return actor;

  const parsed = bannerFields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid banner details.' }, { status: 400 });
  }

  try {
    const banner = await db.$transaction(async (tx) => {
      const created = await tx.banner.create({
        data: {
          title: sanitizeString(parsed.data.title),
          titleAr: clean(parsed.data.titleAr),
          description: clean(parsed.data.description),
          descriptionAr: clean(parsed.data.descriptionAr),
          image: parsed.data.image || null,
          link: parsed.data.link || null,
          ctaText: clean(parsed.data.ctaText),
          ctaTextAr: clean(parsed.data.ctaTextAr),
          ctaLink: parsed.data.ctaLink || null,
          gradient: parsed.data.gradient || null,
          icon: parsed.data.icon || null,
          position: parsed.data.position,
          sortOrder: parsed.data.sortOrder,
          isActive: parsed.data.isActive,
          startDate: parsed.data.startDate ?? new Date(),
          endDate: parsed.data.endDate ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: actor,
          action: 'banner_created',
          targetType: 'banner',
          targetId: created.id,
          details: JSON.stringify({
            title: created.title,
            position: created.position,
            isActive: created.isActive,
          }),
        },
      });

      return created;
    });

    return NextResponse.json(
      { success: true, banner: mapBanner(banner) },
      { status: 201 },
    );
  } catch (error) {
    console.error('Admin banners POST error:', error);
    return NextResponse.json({ error: 'Failed to create banner.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  const actor = requireActor(request);
  if (actor instanceof NextResponse) return actor;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid banner update.' }, { status: 400 });
  }

  try {
    const { bannerId, ...changes } = parsed.data;
    const updated = await db.$transaction(async (tx) => {
      const existing = await tx.banner.findUnique({ where: { id: bannerId } });
      if (!existing) return null;

      const data = {
        ...(changes.title !== undefined
          ? { title: sanitizeString(changes.title) }
          : {}),
        ...(changes.titleAr !== undefined
          ? { titleAr: clean(changes.titleAr) }
          : {}),
        ...(changes.description !== undefined
          ? { description: clean(changes.description) }
          : {}),
        ...(changes.descriptionAr !== undefined
          ? { descriptionAr: clean(changes.descriptionAr) }
          : {}),
        ...(changes.image !== undefined ? { image: changes.image || null } : {}),
        ...(changes.link !== undefined ? { link: changes.link || null } : {}),
        ...(changes.ctaText !== undefined
          ? { ctaText: clean(changes.ctaText) }
          : {}),
        ...(changes.ctaTextAr !== undefined
          ? { ctaTextAr: clean(changes.ctaTextAr) }
          : {}),
        ...(changes.ctaLink !== undefined
          ? { ctaLink: changes.ctaLink || null }
          : {}),
        ...(changes.gradient !== undefined
          ? { gradient: changes.gradient || null }
          : {}),
        ...(changes.icon !== undefined ? { icon: changes.icon || null } : {}),
        ...(changes.position !== undefined ? { position: changes.position } : {}),
        ...(changes.sortOrder !== undefined ? { sortOrder: changes.sortOrder } : {}),
        ...(changes.isActive !== undefined ? { isActive: changes.isActive } : {}),
        ...(changes.startDate !== undefined
          ? { startDate: changes.startDate }
          : {}),
        ...(changes.endDate !== undefined ? { endDate: changes.endDate } : {}),
      };

      const banner = await tx.banner.update({
        where: { id: bannerId },
        data,
      });

      await tx.auditLog.create({
        data: {
          adminId: actor,
          action: 'banner_updated',
          targetType: 'banner',
          targetId: bannerId,
          details: JSON.stringify({
            title: banner.title,
            fields: Object.keys(changes),
            previousPosition: existing.position,
            nextPosition: banner.position,
          }),
        },
      });

      return banner;
    });

    if (!updated) {
      return NextResponse.json({ error: 'Banner not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      banner: mapBanner(updated),
    });
  } catch (error) {
    console.error('Admin banners PUT error:', error);
    return NextResponse.json({ error: 'Failed to update banner.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  const actor = requireActor(request);
  if (actor instanceof NextResponse) return actor;

  const parsedId = idSchema.safeParse(new URL(request.url).searchParams.get('id'));
  if (!parsedId.success) {
    return NextResponse.json({ error: 'A valid banner id is required.' }, { status: 400 });
  }

  try {
    const deleted = await db.$transaction(async (tx) => {
      const banner = await tx.banner.findUnique({ where: { id: parsedId.data } });
      if (!banner) return null;

      await tx.banner.delete({ where: { id: banner.id } });
      await tx.auditLog.create({
        data: {
          adminId: actor,
          action: 'banner_deleted',
          targetType: 'banner',
          targetId: banner.id,
          details: JSON.stringify({
            title: banner.title,
            position: banner.position,
          }),
        },
      });
      return banner;
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Banner not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, bannerId: deleted.id });
  } catch (error) {
    console.error('Admin banners DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete banner.' }, { status: 500 });
  }
}
