import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const notifications = await db.notification.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return Response.json(notifications);
  } catch (error) {
    console.error('Notifications API error:', error);
    return Response.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
