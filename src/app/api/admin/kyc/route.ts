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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    // Query stores that need KYC verification
    // We look at stores where the owner is not verified
    const where: Record<string, unknown> = {};
    if (status === 'pending') {
      where.isVerified = false;
    } else if (status === 'approved') {
      where.isVerified = true;
    }

    const stores = await db.store.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, name: true, email: true, isVerified: true },
        },
      },
    });

    const result = stores
      .filter(s => {
        if (!search) return true;
        return s.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.owner.name || '').toLowerCase().includes(search.toLowerCase());
      })
      .map(s => ({
        id: s.id,
        storeName: s.name,
        owner: s.owner.name || 'Unknown',
        documentType: 'Business License',
        submittedDate: s.createdAt.toISOString().slice(0, 10),
        status: s.isVerified ? 'approved' : 'pending',
        rejectionReason: undefined as string | undefined,
      }));

    return NextResponse.json({ documents: result, total: result.length });
  } catch (error) {
    console.error('Admin KYC GET error:', error);
    return NextResponse.json({ documents: [], total: 0 });
  }
}

export async function PUT(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const body = await request.json();
    const { documentId, action, reviewNotes } = body;

    if (!documentId || !action) {
      return NextResponse.json({ error: 'Missing documentId or action' }, { status: 400 });
    }

    const store = await db.store.findUnique({ where: { id: documentId } });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (action === 'approve') {
      await db.store.update({
        where: { id: documentId },
        data: { isVerified: true },
      });
      await db.user.update({
        where: { id: store.ownerId },
        data: { isVerified: true },
      });
    } else if (action === 'reject') {
      // Store stays unverified
    }

    return NextResponse.json({ success: true, documentId, status: action === 'approve' ? 'approved' : 'rejected' });
  } catch (error) {
    console.error('Admin KYC PUT error:', error);
    return NextResponse.json({ error: 'Failed to update KYC document' }, { status: 500 });
  }
}
