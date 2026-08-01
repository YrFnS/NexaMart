import { db } from '@/lib/db';
import { validatePagination } from '@/lib/security';

function validStoreId(value: string | null): string | null {
  const storeId = value?.trim() || '';
  return storeId.length > 0 && storeId.length <= 64 ? storeId : null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = validStoreId(searchParams.get('storeId'));
    if (!storeId) {
      return Response.json(
        { error: 'A valid store ID is required.' },
        { status: 400 },
      );
    }

    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      50,
    );

    const store = await db.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, nameAr: true },
    });
    if (!store) {
      return Response.json({ error: 'Store not found.' }, { status: 404 });
    }

    const where = { storeId };
    const [reviews, aggregate, grouped] = await db.$transaction([
      db.storeReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      }),
      db.storeReview.aggregate({
        where,
        _avg: { rating: true },
        _count: { _all: true },
      }),
      db.storeReview.groupBy({
        by: ['rating'],
        where,
        _count: { _all: true },
      }),
    ]);

    const userIds = [...new Set(reviews.map((review) => review.userId))];
    const users = userIds.length
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, avatar: true },
        })
      : [];
    const userById = new Map(users.map((user) => [user.id, user]));
    const total = aggregate._count._all;
    const counts = new Map(
      grouped.map((entry) => [entry.rating, entry._count._all]),
    );
    const distribution = Object.fromEntries(
      [5, 4, 3, 2, 1].map((rating) => {
        const count = counts.get(rating) || 0;
        return [
          rating,
          {
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          },
        ];
      }),
    );

    return Response.json({
      store,
      reviews: reviews.map((review) => {
        const user = userById.get(review.userId);
        return {
          id: review.id,
          userName: user?.name || 'Anonymous',
          userAvatar: user?.avatar || null,
          rating: review.rating,
          comment: review.comment || '',
          date: review.createdAt.toISOString(),
        };
      }),
      total,
      averageRating:
        aggregate._avg.rating === null
          ? 0
          : Math.round(aggregate._avg.rating * 10) / 10,
      ratingDistribution: distribution,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Store reviews API error:', error);
    return Response.json(
      { error: 'Failed to fetch store reviews.' },
      { status: 500 },
    );
  }
}
