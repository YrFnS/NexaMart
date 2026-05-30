import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    const where: Record<string, unknown> = {};
    if (storeId) where.storeId = storeId;

    const reviews = await db.storeReview.findMany({
      where,
      include: {
        store: {
          select: { name: true, nameAr: true, rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get user names for reviews
    const reviewsWithUser = await Promise.all(
      reviews.map(async (review) => {
        const user = await db.user.findUnique({
          where: { id: review.userId },
          select: { name: true, avatar: true },
        });
        return {
          id: review.id,
          storeId: review.storeId,
          storeName: review.store.name,
          storeNameAr: review.store.nameAr,
          userId: review.userId,
          userName: user?.name || 'Anonymous',
          userAvatar: user?.avatar || '',
          rating: review.rating,
          comment: review.comment,
          date: review.createdAt.toISOString(),
          helpful: 0,
        };
      })
    );

    // Calculate average rating
    const avgRating = reviewsWithUser.length > 0
      ? Math.round((reviewsWithUser.reduce((sum, r) => sum + r.rating, 0) / reviewsWithUser.length) * 10) / 10
      : 0;

    // Calculate rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
      star,
      count: reviewsWithUser.filter(r => r.rating === star).length,
      percentage: reviewsWithUser.length > 0
        ? Math.round((reviewsWithUser.filter(r => r.rating === star).length / reviewsWithUser.length) * 100)
        : 0,
    }));

    return Response.json({
      reviews: reviewsWithUser,
      total: reviewsWithUser.length,
      averageRating: avgRating,
      ratingDistribution,
    });
  } catch (error) {
    console.error('Store Reviews API error:', error);
    return Response.json({ error: 'Failed to fetch store reviews' }, { status: 500 });
  }
}
