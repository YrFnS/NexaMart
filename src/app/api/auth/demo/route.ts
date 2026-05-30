import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await db.user.findUnique({ where: { email: 'demo@nexamart.com' } });
    if (!user) {
      return Response.json({ error: 'Demo user not found. Run /api/seed first.' }, { status: 404 });
    }
    return Response.json({ user });
  } catch (error) {
    console.error('Auth demo error:', error);
    return Response.json({ error: 'Failed to get demo user' }, { status: 500 });
  }
}
