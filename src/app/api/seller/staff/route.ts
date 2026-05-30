import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return Response.json({ staff: [], activityLog: [] });
    }

    const staff = await db.staff.findMany({
      where: { storeId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = staff.map((s) => ({
      id: s.id,
      name: s.user?.name || s.inviteEmail || 'Unknown',
      email: s.user?.email || s.inviteEmail || '',
      role: s.role,
      status: s.status === 'active' ? 'active' : s.status === 'pending' ? 'invited' : 'suspended',
      lastActive: s.status === 'active' ? 'Recently' : s.status === 'pending' ? 'Never' : 'Inactive',
      permissions: [] as string[],
      joinDate: s.createdAt.toISOString().split('T')[0],
    }));

    // Activity log is not stored in DB yet — return empty
    const activityLog: { id: string; staffId: string; staffName: string; actionEn: string; actionAr: string; target: string; timestamp: string }[] = [];

    return Response.json({ staff: mapped, activityLog });
  } catch (error) {
    console.error('Staff API error:', error);
    return Response.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, inviteEmail, role } = body;

    if (!storeId || !inviteEmail) {
      return Response.json(
        { error: 'Missing required fields: storeId, inviteEmail' },
        { status: 400 }
      );
    }

    // Find or create user by email
    let user = await db.user.findUnique({ where: { email: inviteEmail } });

    if (!user) {
      user = await db.user.create({
        data: {
          email: inviteEmail,
          name: inviteEmail.split('@')[0],
          role: 'seller',
        },
      });
    }

    const staff = await db.staff.create({
      data: {
        storeId,
        userId: user.id,
        inviteEmail,
        role: role || 'viewer',
        status: 'pending',
      },
      include: { user: true },
    });

    return Response.json({
      staff: {
        id: staff.id,
        name: staff.user?.name || staff.inviteEmail || 'Unknown',
        email: staff.user?.email || staff.inviteEmail || '',
        role: staff.role,
        status: 'invited',
        lastActive: 'Never',
        permissions: [],
        joinDate: staff.createdAt.toISOString().split('T')[0],
      },
      message: 'Invitation sent successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create Staff API error:', error);
    return Response.json({ error: 'Failed to create staff invitation' }, { status: 500 });
  }
}
