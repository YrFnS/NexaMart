import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const role = new URL(request.url).searchParams.get('role');
    const email = role === 'seller' ? 'seller@nexamart.com' : 'demo@nexamart.com';
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: 'Demo user not found. Run /api/seed first.' }, { status: 404 });
    }
    return Response.json({ user });
  } catch (error) {
    console.error('Auth demo error:', error);
    return Response.json({ error: 'Failed to get demo user' }, { status: 500 });
  }
}
