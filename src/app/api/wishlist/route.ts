import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
  validatePagination,
} from '@/lib/security';

const mutationSchema = z.object({
  action: z.enum(['toggle', 'remove']).default('toggle'),
  productId: z.string().min(1).max(64).optional(),
  itemId: z.string().min(1).max(64).optional(),
});

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100,
    );

    const wishlist = await db.wishlist.findMany({
      where: { userId: auth.user.id },
      include: {
        product: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist.' },
      { status: 500 },
    );
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

  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid wishlist action.' }, { status: 400 });
  }

  try {
    if (parsed.data.action === 'remove') {
      if (!parsed.data.itemId) {
        return NextResponse.json(
          { error: 'Wishlist item id is required.' },
          { status: 400 },
        );
      }

      const removed = await db.wishlist.deleteMany({
        where: { id: parsed.data.itemId, userId: auth.user.id },
      });
      if (removed.count !== 1) {
        return NextResponse.json(
          { error: 'Wishlist item not found.' },
          { status: 404 },
        );
      }
      return NextResponse.json({ removed: true });
    }

    if (!parsed.data.productId) {
      return NextResponse.json(
        { error: 'Product id is required.' },
        { status: 400 },
      );
    }

    const product = await db.product.findFirst({
      where: { id: parsed.data.productId, status: 'active' },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const existing = await db.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: auth.user.id,
          productId: product.id,
        },
      },
    });

    if (existing) {
      await db.wishlist.deleteMany({
        where: { id: existing.id, userId: auth.user.id },
      });
      return NextResponse.json({ removed: true, productId: product.id });
    }

    const item = await db.wishlist.create({
      data: { userId: auth.user.id, productId: product.id },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ added: true }, { status: 200 });
    }
    console.error('Wishlist POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update wishlist.' },
      { status: 500 },
    );
  }
}
