import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIds = searchParams.get('storeIds');

    if (storeIds) {
      const ids = storeIds.split(',').filter(Boolean);
      const stores = await db.store.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
          nameAr: true,
          logo: true,
          isVerified: true,
          productCount: true,
          rating: true,
          reviewCount: true,
        },
      });

      const mapped = stores.map((s) => ({
        id: s.id,
        nameEn: s.name,
        nameAr: s.nameAr || '',
        initials: s.name.substring(0, 2).toUpperCase(),
        logo: s.logo,
        isVerified: s.isVerified,
        productCount: s.productCount,
        followerCount: s.reviewCount,
        rating: s.rating,
        gradient: 'from-emerald-500 to-teal-600',
      }));

      return NextResponse.json({ stores: mapped });
    }

    // Return all stores (for general browsing)
    const stores = await db.store.findMany({
      select: {
        id: true,
        name: true,
        nameAr: true,
        logo: true,
        isVerified: true,
        productCount: true,
        rating: true,
        reviewCount: true,
      },
      take: 20,
    });

    const mapped = stores.map((s) => ({
      id: s.id,
      nameEn: s.name,
      nameAr: s.nameAr || '',
      initials: s.name.substring(0, 2).toUpperCase(),
      logo: s.logo,
      isVerified: s.isVerified,
      productCount: s.productCount,
      followerCount: s.reviewCount,
      rating: s.rating,
      gradient: 'from-emerald-500 to-teal-600',
    }));

    return NextResponse.json({ stores: mapped });
  } catch (error) {
    console.error('Followed Stores API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const store = await db.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        nameAr: true,
        logo: true,
        isVerified: true,
        productCount: true,
        rating: true,
        reviewCount: true,
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({
      followed: true,
      store: {
        id: store.id,
        nameEn: store.name,
        nameAr: store.nameAr || '',
        initials: store.name.substring(0, 2).toUpperCase(),
        isVerified: store.isVerified,
        productCount: store.productCount,
        followerCount: store.reviewCount,
        rating: store.rating,
      },
      newProductsCount: 0,
    }, { status: 201 });
  } catch (error) {
    console.error('Follow Store API error:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    return NextResponse.json({ unfollowed: true, storeId });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
