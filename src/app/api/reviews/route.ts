import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/security';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const where = productId ? { productId } : {};
    const reviews = await db.review.findMany({
      where,
      include: {
        user: { select: { name: true, avatar: true } },
        product: { select: { name: true, nameAr: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(reviews);
  } catch (error) {
    console.error('Reviews API error:', error);
    return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, productId, rating, comment } = await request.json();

    // Validate required fields
    if (!userId || !productId || !rating) {
      return Response.json({ error: 'Missing required fields: userId, productId, rating' }, { status: 400 });
    }

    // Validate rating range
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return Response.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Sanitize user input to prevent XSS
    const safeComment = typeof comment === 'string' ? sanitizeString(comment) : '';

    const review = await db.review.create({
      data: { userId, productId, rating: numRating, comment: safeComment, isVerified: true },
    });
    return Response.json(review);
  } catch (error) {
    console.error('Reviews API error:', error);
    return Response.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
