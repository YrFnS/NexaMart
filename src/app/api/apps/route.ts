import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category;
    }

    const apps = await db.app.findMany({
      where,
      orderBy: { installs: 'desc' },
    });

    const mapped = apps.map((app) => ({
      id: app.id,
      name: app.name,
      nameAr: app.nameAr,
      description: app.description,
      descriptionAr: app.descriptionAr,
      category: app.category,
      icon: app.icon,
      rating: app.rating,
      installCount: app.installs,
      pricing: app.isFree ? 'free' : app.price === 0 ? 'freemium' : 'paid',
      price: app.price,
    }));

    return Response.json({
      apps: mapped,
      total: mapped.length,
    });
  } catch (error) {
    console.error('Apps API error:', error);
    return Response.json({ error: 'Failed to fetch apps' }, { status: 500 });
  }
}
