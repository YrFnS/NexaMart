import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
} from '@/lib/security';

const inviteSchema = z.object({
  storeId: z.string().min(1).max(64),
  inviteEmail: z.string().trim().email().max(254),
  role: z.enum(['manager', 'editor', 'viewer']).default('viewer'),
});

async function canManageStore(
  storeId: string,
  user: { id: string; role: 'buyer' | 'seller' | 'admin' },
) {
  if (user.role === 'admin') {
    return Boolean(await db.store.findUnique({ where: { id: storeId }, select: { id: true } }));
  }

  return Boolean(
    await db.store.findFirst({
      where: {
        id: storeId,
        OR: [
          { ownerId: user.id },
          {
            staff: {
              some: {
                userId: user.id,
                status: 'active',
                role: { in: ['owner', 'manager'] },
              },
            },
          },
        ],
      },
      select: { id: true },
    }),
  );
}

function mapStaff(staff: {
  id: string;
  role: string;
  status: string;
  inviteEmail: string | null;
  createdAt: Date;
  user: { name: string | null; email: string };
}) {
  return {
    id: staff.id,
    name: staff.user.name || staff.inviteEmail || staff.user.email,
    email: staff.user.email,
    role: staff.role,
    status:
      staff.status === 'active'
        ? 'active'
        : staff.status === 'pending'
          ? 'invited'
          : 'suspended',
    lastActive:
      staff.status === 'active'
        ? 'Recently'
        : staff.status === 'pending'
          ? 'Never'
          : 'Inactive',
    permissions: [] as string[],
    joinDate: staff.createdAt.toISOString().slice(0, 10),
  };
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const storeId = new URL(request.url).searchParams.get('storeId');
  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required.' }, { status: 400 });
  }

  if (!(await canManageStore(storeId, auth.user))) {
    return NextResponse.json({ error: 'Store management access is required.' }, { status: 403 });
  }

  try {
    const staff = await db.staff.findMany({
      where: { storeId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      staff: staff.map(mapStaff),
      activityLog: [],
    });
  } catch (error) {
    console.error('Staff GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff.' }, { status: 500 });
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

  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid staff invitation.' }, { status: 400 });
  }

  if (!(await canManageStore(parsed.data.storeId, auth.user))) {
    return NextResponse.json({ error: 'Store management access is required.' }, { status: 403 });
  }

  try {
    const invitedUser = await db.user.findUnique({
      where: { email: parsed.data.inviteEmail.toLowerCase() },
      select: { id: true, name: true, email: true, isBanned: true },
    });

    if (!invitedUser || invitedUser.isBanned) {
      return NextResponse.json(
        { error: 'The invited email must belong to an active NexaMart account.' },
        { status: 404 },
      );
    }

    const existing = await db.staff.findFirst({
      where: { storeId: parsed.data.storeId, userId: invitedUser.id },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'This account is already associated with the store.' },
        { status: 409 },
      );
    }

    const staff = await db.staff.create({
      data: {
        storeId: parsed.data.storeId,
        userId: invitedUser.id,
        inviteEmail: invitedUser.email,
        role: parsed.data.role,
        status: 'pending',
      },
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json(
      {
        staff: mapStaff(staff),
        message: 'Staff invitation created.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Staff POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create staff invitation.' },
      { status: 500 },
    );
  }
}
