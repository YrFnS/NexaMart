import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  sanitizeString,
  validateCsrf,
  validatePagination,
} from '@/lib/security';

const reviewSchema = z.object({
  productId: z.string().min(1).max(64),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2_000).optional(),
  images: z.array(z.string().trim().max(2_000)).max(5).default([]),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100,
    );
    const where = productId ? { productId } : {};

    const [reviews, total] = await db.$transaction([
      db.review.findMany({
        where,
        include: {
          user: { select: { name: true, avatar: true } },
          product: { select: { name: true, nameAr: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.review.count({ where }),
    ]);

    return NextResponse.json({ reviews, total, page, limit });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid review details.' }, { status: 400 });
  }

  try {
    const result = await db.$transaction(
      async (tx) => {
        const product = await tx.product.findFirst({
          where: { id: parsed.data.productId, status: 'active' },
          select: { id: true },
        });
        if (!product) return { kind: 'not_found' as const };

        const existing = await tx.review.findFirst({
          where: { userId: auth.user.id, productId: parsed.data.productId },
          select: { id: true },
        });
        if (existing) return { kind: 'duplicate' as const };

        const purchased = Boolean(
          await tx.orderItem.findFirst({
            where: {
              productId: parsed.data.productId,
              order: { userId: auth.user.id, status: 'delivered' },
            },
            select: { id: true },
          }),
        );

        const review = await tx.review.create({
          data: {
            userId: auth.user.id,
            productId: parsed.data.productId,
            rating: parsed.data.rating,
            comment: parsed.data.comment
              ? sanitizeString(parsed.data.comment)
              : null,
            images: JSON.stringify(parsed.data.images),
            isVerified: purchased,
          },
          include: {
            user: { select: { name: true, avatar: true } },
            product: { select: { name: true, nameAr: true, price: true } },
          },
        });

        const aggregate = await tx.review.aggregate({
          where: { productId: parsed.data.productId },
          _avg: { rating: true },
          _count: { rating: true },
        });
        await tx.product.update({
          where: { id: parsed.data.productId },
          data: {
            rating: aggregate._avg.rating || 0,
            reviewCount: aggregate._count.rating,
          },
        });

        return { kind: 'created' as const, review };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 10_000,
      },
    );

    if (result.kind === 'not_found') {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    if (result.kind === 'duplicate') {
      return NextResponse.json(
        { error: 'You have already reviewed this product.' },
        { status: 409 },
      );
    }

    return NextResponse.json(result.review, { status: 201 });
  } catch (error) {
    console.error('Reviews POST error:', error);
    return NextResponse.json({ error: 'Failed to create review.' }, { status: 500 });
  }
}
