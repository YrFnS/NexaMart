import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkApiRateLimit, RATE_LIMITS, requireAdminAuth, sanitizeString } from '@/lib/security';

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    const result = categories.map(c => ({
      id: c.id,
      name: c.name,
      nameAr: c.nameAr,
      slug: c.slug,
      icon: c.icon,
      image: c.image,
      parentId: c.parentId,
      productCount: c._count.products,
      childCount: c._count.children,
      createdAt: c.createdAt.toISOString(),
    }));

    // Build hierarchical structure
    const rootCategories = result.filter(c => !c.parentId);
    const childMap = new Map<string, typeof result>();
    result.filter(c => c.parentId).forEach(c => {
      const children = childMap.get(c.parentId!) || [];
      children.push(c);
      childMap.set(c.parentId!, children);
    });

    const hierarchical = rootCategories.map(c => ({
      ...c,
      children: childMap.get(c.id) || [],
    }));

    return NextResponse.json({ categories: result, hierarchical, total: result.length });
  } catch (error) {
    console.error('Admin categories GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
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
    const { name, nameAr, slug, icon, image, parentId, adminId } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Missing name or slug' }, { status: 400 });
    }

    // Check for duplicate slug
    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const category = await db.category.create({
      data: {
        name: sanitizeString(name),
        nameAr: nameAr ? sanitizeString(nameAr) : null,
        slug,
        icon: icon || null,
        image: image || null,
        parentId: parentId || null,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminId: adminId || 'system',
        action: 'category_created',
        targetType: 'category',
        targetId: category.id,
        details: `Category created: ${name}`,
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error('Admin categories POST error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
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
    const { categoryId, name, nameAr, icon, image, parentId, adminId } = body;

    if (!categoryId) {
      return NextResponse.json({ error: 'Missing categoryId' }, { status: 400 });
    }

    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = sanitizeString(name);
    if (nameAr !== undefined) updateData.nameAr = nameAr ? sanitizeString(nameAr) : null;
    if (icon !== undefined) updateData.icon = icon;
    if (image !== undefined) updateData.image = image;
    if (parentId !== undefined) updateData.parentId = parentId;

    await db.category.update({ where: { id: categoryId }, data: updateData });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminId: adminId || 'system',
        action: 'category_updated',
        targetType: 'category',
        targetId: categoryId,
        details: `Category updated: ${name || category.name}`,
      },
    });

    return NextResponse.json({ success: true, categoryId });
  } catch (error) {
    console.error('Admin categories PUT error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
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
    const categoryId = searchParams.get('id');
    const adminId = searchParams.get('adminId');

    if (!categoryId) {
      return NextResponse.json({ error: 'Missing category id' }, { status: 400 });
    }

    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check for child categories
    const children = await db.category.count({ where: { parentId: categoryId } });
    if (children > 0) {
      return NextResponse.json({ error: 'Cannot delete category with children. Move or delete children first.' }, { status: 400 });
    }

    await db.category.delete({ where: { id: categoryId } });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminId: adminId || 'system',
        action: 'category_deleted',
        targetType: 'category',
        targetId: categoryId,
        details: `Category deleted: ${category.name}`,
      },
    });

    return NextResponse.json({ success: true, categoryId });
  } catch (error) {
    console.error('Admin categories DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
