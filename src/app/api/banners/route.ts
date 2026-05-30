import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/banners?position=hero — Public endpoint for active banners
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || 'hero';
    const isActive = searchParams.get('isActive');

    const now = new Date();

    const where: Record<string, unknown> = { position };

    if (isActive === 'true') {
      where.isActive = true;
      // Only show banners within their date range (if set)
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
    }));

    return NextResponse.json({ banners: result, total: result.length });
  } catch (error) {
    console.error('Public banners GET error:', error);
    return NextResponse.json({ banners: [], total: 0 }, { status: 500 });
  }
}

// POST /api/banners — Create a new banner
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, titleAr, description, descriptionAr, image, link, ctaText, ctaTextAr, ctaLink, gradient, icon, position, sortOrder, isActive, startDate, endDate } = body;

    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    const validPositions = ['hero', 'sidebar', 'footer', 'popup', 'category'];
    if (position && !validPositions.includes(position)) {
      return NextResponse.json({ error: 'Invalid position value' }, { status: 400 });
    }

    const banner = await db.banner.create({
      data: {
        title,
        titleAr: titleAr || null,
        description: description || null,
        descriptionAr: descriptionAr || null,
        image: image || null,
        link: link || null,
        ctaText: ctaText || null,
        ctaTextAr: ctaTextAr || null,
        ctaLink: ctaLink || null,
        gradient: gradient || null,
        icon: icon || null,
        position: position || 'hero',
        sortOrder: sortOrder ?? 0,
        isActive: isActive !== false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (error) {
    console.error('Banners POST error:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}

// PUT /api/banners — Update an existing banner
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, titleAr, description, descriptionAr, image, link, ctaText, ctaTextAr, ctaLink, gradient, icon, position, sortOrder, isActive, startDate, endDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing banner id' }, { status: 400 });
    }

    const banner = await db.banner.findUnique({ where: { id } });
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
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    await db.banner.update({ where: { id }, data: updateData });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Banners PUT error:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

// DELETE /api/banners?id=xxx — Delete a banner
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing banner id' }, { status: 400 });
    }

    const banner = await db.banner.findUnique({ where: { id } });
    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    await db.banner.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Banners DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
