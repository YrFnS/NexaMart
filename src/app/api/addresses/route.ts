import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/auth';
import { checkApiRateLimit, RATE_LIMITS, validateCsrf } from '@/lib/security';

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export async function GET(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.general);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;
  const currentUser = auth.user;

  try {
    const requestedUserId = new URL(request.url).searchParams.get('userId') || currentUser.id;
    if (requestedUserId !== currentUser.id && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const addresses = await db.address.findMany({
      where: { userId: requestedUserId },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
      take: 50,
    });

    const response = NextResponse.json({ addresses, total: addresses.length });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('Addresses API error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin' }, { status: 403 });
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;
  const currentUser = auth.user;

  try {
    const parsedBody: unknown = await request.json();
    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const body = parsedBody as Record<string, unknown>;
    const requestedUserId = cleanText(body.userId, 64) || currentUser.id;
    if (requestedUserId !== currentUser.id && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fullName = cleanText(body.fullName, 100);
    const phone = cleanText(body.phone, 30);
    const address1 = cleanText(body.address1, 200);
    const address2 = cleanText(body.address2, 200);
    const city = cleanText(body.city, 100);
    const state = cleanText(body.state, 100);
    const postalCode = cleanText(body.postalCode, 30);
    const country = cleanText(body.country, 100) || 'Iraq';
    const label = cleanText(body.label, 50) || 'Home';
    const isDefault = body.isDefault === true;

    if (!fullName || !phone || !address1 || !city) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, phone, address1, city' },
        { status: 400 },
      );
    }

    const address = await db.$transaction(
      async tx => {
        const existingCount = await tx.address.count({ where: { userId: requestedUserId } });
        if (existingCount >= 50) {
          throw new Error('ADDRESS_LIMIT_REACHED');
        }

        if (isDefault || existingCount === 0) {
          await tx.address.updateMany({
            where: { userId: requestedUserId, isDefault: true },
            data: { isDefault: false },
          });
        }

        return tx.address.create({
          data: {
            userId: requestedUserId,
            label,
            fullName,
            phone,
            address1,
            address2: address2 || null,
            city,
            state: state || null,
            postalCode: postalCode || null,
            country,
            isDefault: isDefault || existingCount === 0,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );

    return NextResponse.json({ address, message: 'Address created successfully' }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'ADDRESS_LIMIT_REACHED') {
      return NextResponse.json({ error: 'Address limit reached' }, { status: 409 });
    }
    console.error('Create Address API error:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}
