import { db } from '@/lib/db';

export async function GET() {
  try {
    const categories = await db.category.findMany({ orderBy: { name: 'asc' } });
    return Response.json(categories);
  } catch (error) {
    console.error('Categories API error:', error);
    return Response.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
