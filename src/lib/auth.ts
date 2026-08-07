import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionClaims, type SessionRole } from '@/lib/session';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: SessionRole;
  loyaltyTier: string;
  loyaltyPoints: number;
  walletBalance: number;
  aiCredits: number;
  isVerified: boolean;
}

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  avatar: true,
  role: true,
  loyaltyTier: true,
  loyaltyPoints: true,
  walletBalance: true,
  aiCredits: true,
  isVerified: true,
  isBanned: true,
} as const;

export function toAuthenticatedUser(user: {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  loyaltyTier: string;
  loyaltyPoints: number;
  walletBalance: number;
  aiCredits: number;
  isVerified: boolean;
}): AuthenticatedUser {
  const role: SessionRole = ['buyer', 'seller', 'admin'].includes(user.role)
    ? (user.role as SessionRole)
    : 'buyer';

  return {
    id: user.id,
    email: user.email,
    name: user.name?.trim() || user.email.split('@')[0],
    phone: user.phone || undefined,
    avatar: user.avatar || undefined,
    role,
    loyaltyTier: user.loyaltyTier,
    loyaltyPoints: user.loyaltyPoints,
    walletBalance: user.walletBalance,
    aiCredits: user.aiCredits,
    isVerified: user.isVerified,
  };
}

export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  const claims = getSessionClaims(request);
  if (!claims) return null;

  const user = await db.user.findUnique({
    where: { id: claims.sub },
    select: publicUserSelect,
  });

  if (!user || user.isBanned || user.role !== claims.role) {
    return null;
  }

  return toAuthenticatedUser(user);
}

export async function requireAuthenticatedUser(
  request: Request,
): Promise<{ user: AuthenticatedUser; response: null } | { user: null; response: NextResponse }> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  return { user, response: null };
}

export async function requireUserRole(
  request: Request,
  allowedRoles: readonly SessionRole[],
): Promise<{ user: AuthenticatedUser; response: null } | { user: null; response: NextResponse }> {
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth;

  if (allowedRoles.includes(auth.user.role)) return auth;

  const activeSellerStaff = allowedRoles.includes('seller')
    ? await db.staff.findFirst({
        where: {
          userId: auth.user.id,
          status: 'active',
          role: { in: ['owner', 'manager', 'editor'] },
        },
        select: { id: true },
      })
    : null;
  if (activeSellerStaff) return auth;

  return {
    user: null,
    response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
  };
}
