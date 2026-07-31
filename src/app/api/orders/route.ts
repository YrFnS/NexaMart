import { requireAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { validateEnum, validatePagination } from '@/lib/security';

const VALID_ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'disputed',
  'refunded',
] as const;

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const statusRaw = searchParams.get('status');
    const status = statusRaw
      ? validateEnum(statusRaw, VALID_ORDER_STATUSES)
      : undefined;
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      50,
    );

    if (statusRaw && !status) {
      return Response.json({ error: 'Invalid order status.' }, { status: 400 });
    }

    const userId =
      auth.user.role === 'admin' && requestedUserId
        ? requestedUserId
        : auth.user.id;
    const where = { userId, ...(status ? { status } : {}) };

    const [orders, total] = await db.$transaction([
      db.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                  images: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  sku: true,
                  attributes: true,
                },
              },
            },
          },
          store: {
            select: { id: true, name: true, nameAr: true, logo: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    return Response.json({ orders, total, page, limit });
  } catch (error) {
    console.error('Orders API error:', error);
    return Response.json({ error: 'Failed to fetch orders.' }, { status: 500 });
  }
}
