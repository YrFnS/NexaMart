import { db } from '@/lib/db';

export async function GET() {
  try {
    const [productCount, storeCount, userCount] = await Promise.all([
      db.product.count({ where: { status: 'active' } }),
      db.store.count(),
      db.user.count(),
    ]);

    // Count distinct countries from user addresses
    const countryResult = await db.address.findMany({
      select: { country: true },
      distinct: ['country'],
    });

    return Response.json({
      products: productCount,
      sellers: storeCount,
      users: userCount,
      countries: countryResult.length,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
