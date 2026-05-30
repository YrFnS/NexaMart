import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkApiRateLimit, RATE_LIMITS, requireAdminAuth } from '@/lib/security';

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        walletBalance: true,
        avatar: true,
        phone: true,
        createdAt: true,
        orders: {
          select: { id: true, total: true },
        },
      },
    });

    const result = users.map(u => {
      const orderCount = u.orders.length;
      const revenue = u.orders.reduce((sum, o) => sum + o.total, 0);
      let status: 'active' | 'banned' | 'suspended' = 'active';
      if (u.isBanned) status = 'banned';

      return {
        id: u.id,
        name: u.name || 'Unknown',
        email: u.email,
        role: u.role,
        status,
        joined: u.createdAt.toISOString().split('T')[0],
        avatar: u.avatar,
        phone: u.phone,
        orders: orderCount,
        revenue,
        walletBalance: u.walletBalance,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json([]);
  }
}
