import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateSearchParam, isValidId, checkApiRateLimit, RATE_LIMITS, requireAdminAuth, sanitizeString } from '@/lib/security';

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const banners = await db.banner.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const result = banners.map(b => ({
      id: b.id,
      title: b.title,
      titleAr: b.titleAr,
      description: b.description,
      descriptionAr: b.descriptionAr,
      image: b.image,
      link: b.link,
      ctaText: b.ctaText,
      ctaTextAr: b.ctaTextAr,
      ctaLink: b.ctaLink,
      gradient: b.gradient,
      icon: b.icon,
      position: b.position,
      sortOrder: b.sortOrder,
      isActive: b.isActive,
      startDate: b.startDate ? b.startDate.toISOString() : null,
      endDate: b.endDate ? b.endDate.toISOString() : null,
      createdAt: b.createdAt.toISOString(),
    }));

    return NextResponse.json({ banners: result, total: result.length });
  } catch (error) {
    console.error('Admin banners GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const body = await request.json();
    const { title, titleAr, description, descriptionAr, image, link, ctaText, ctaTextAr, ctaLink, gradient, icon, position, sortOrder, isActive, startDate, endDate, adminId } = body;

    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    // Validate title length
    if (typeof title === 'string' && title.length > 200) {
      return NextResponse.json({ error: 'Title too long (max 200 chars)' }, { status: 400 });
    }

    // Validate position
    const validPositions = ['hero', 'sidebar', 'footer', 'popup', 'category'];
    if (position && !validPositions.includes(position)) {
      return NextResponse.json({ error: 'Invalid position value' }, { status: 400 });
    }

    const banner = await db.banner.create({
      data: {
        title: sanitizeString(title),
        titleAr: titleAr ? sanitizeString(titleAr) : null,
        description: description ? sanitizeString(description) : null,
        descriptionAr: descriptionAr ? sanitizeString(descriptionAr) : null,
        image: image || null,
        link: link || null,
        ctaText: ctaText ? sanitizeString(ctaText) : null,
        ctaTextAr: ctaTextAr ? sanitizeString(ctaTextAr) : null,
        ctaLink: ctaLink || null,
        gradient: gradient || null,
        icon: icon || null,
        position: position || 'hero',
        sortOrder: sortOrder ?? 0,
        isActive: isActive !== false,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    // Create audit log (non-blocking)
    try {
      await db.auditLog.create({
        data: {
          adminId: adminId || 'system',
          action: 'banner_created',
          targetType: 'banner',
          targetId: banner.id,
          details: `Banner created: ${title}`,
        },
      });
    } catch {
      // Audit log is optional
    }

    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (error) {
    console.error('Admin banners POST error:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const body = await request.json();
    const { bannerId, title, titleAr, description, descriptionAr, image, link, ctaText, ctaTextAr, ctaLink, gradient, icon, position, sortOrder, isActive, startDate, endDate, adminId } = body;

    if (!bannerId) {
      return NextResponse.json({ error: 'Missing bannerId' }, { status: 400 });
    }

    const banner = await db.banner.findUnique({ where: { id: bannerId } });
    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (titleAr !== undefined) updateData.titleAr = titleAr;
    if (description !== undefined) updateData.description = description;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr;
    if (image !== undefined) updateData.image = image;
    if (link !== undefined) updateData.link = link;
    if (ctaText !== undefined) updateData.ctaText = ctaText;
    if (ctaTextAr !== undefined) updateData.ctaTextAr = ctaTextAr;
    if (ctaLink !== undefined) updateData.ctaLink = ctaLink;
    if (gradient !== undefined) updateData.gradient = gradient;
    if (icon !== undefined) updateData.icon = icon;
    if (position !== undefined) updateData.position = position;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    await db.banner.update({ where: { id: bannerId }, data: updateData });

    // Create audit log (non-blocking)
    try {
      await db.auditLog.create({
        data: {
          adminId: adminId || 'system',
          action: 'banner_updated',
          targetType: 'banner',
          targetId: bannerId,
          details: `Banner updated: ${title || banner.title}`,
        },
      });
    } catch {
      // Audit log is optional
    }

    return NextResponse.json({ success: true, bannerId });
  } catch (error) {
    console.error('Admin banners PUT error:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const { searchParams } = new URL(request.url);
    const bannerId = searchParams.get('id');
    const adminId = searchParams.get('adminId');

    if (!bannerId) {
      return NextResponse.json({ error: 'Missing banner id' }, { status: 400 });
    }

    // Validate bannerId format
    if (!isValidId(bannerId)) {
      return NextResponse.json({ error: 'Invalid banner ID format' }, { status: 400 });
    }

    const banner = await db.banner.findUnique({ where: { id: bannerId } });
    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    await db.banner.delete({ where: { id: bannerId } });

    // Create audit log (non-blocking)
    try {
      await db.auditLog.create({
        data: {
          adminId: adminId || 'system',
          action: 'banner_deleted',
          targetType: 'banner',
          targetId: bannerId,
          details: `Banner deleted: ${banner.title}`,
        },
      });
    } catch {
      // Audit log is optional
    }

    return NextResponse.json({ success: true, bannerId });
  } catch (error) {
    console.error('Admin banners DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
