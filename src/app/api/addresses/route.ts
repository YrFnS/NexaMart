import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
} from '@/lib/security';

const addressFields = z.object({
  label: z.string().trim().max(50).optional(),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(30),
  address1: z.string().trim().min(3).max(200),
  address2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(30).optional().nullable(),
  country: z.string().trim().min(2).max(100).default('Iraq'),
  isDefault: z.boolean().default(false),
});

const updateSchema = addressFields.partial().extend({
  id: z.string().min(1).max(64),
});

function mapAddress(address: {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}) {
  return {
    id: address.id,
    label: address.label,
    name: address.fullName,
    fullName: address.fullName,
    phone: address.phone,
    address1: address.address1,
    address2: address.address2 || undefined,
    city: address.city,
    state: address.state || '',
    postalCode: address.postalCode || '',
    country: address.country,
    isDefault: address.isDefault,
  };
}

async function authenticate(request: Request) {
  return requireAuthenticatedUser(request);
}

function validateWriteRequest(request: Request): NextResponse | null {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }
  return null;
}

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if (auth.response) return auth.response;

  try {
    const addresses = await db.address.findMany({
      where: { userId: auth.user.id },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    });

    return NextResponse.json({
      addresses: addresses.map(mapAddress),
      total: addresses.length,
    });
  } catch (error) {
    console.error('Addresses GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const validationError = validateWriteRequest(request);
  if (validationError) return validationError;

  const auth = await authenticate(request);
  if (auth.response) return auth.response;

  const parsed = addressFields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid address details.' }, { status: 400 });
  }

  try {
    const address = await db.$transaction(async (tx) => {
      if (parsed.data.isDefault) {
        await tx.address.updateMany({
          where: { userId: auth.user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: auth.user.id,
          label: parsed.data.label || 'Home',
          fullName: parsed.data.fullName,
          phone: parsed.data.phone,
          address1: parsed.data.address1,
          address2: parsed.data.address2 || null,
          city: parsed.data.city,
          state: parsed.data.state || null,
          postalCode: parsed.data.postalCode || null,
          country: parsed.data.country,
          isDefault: parsed.data.isDefault,
        },
      });
    });

    return NextResponse.json({ address: mapAddress(address) }, { status: 201 });
  } catch (error) {
    console.error('Addresses POST error:', error);
    return NextResponse.json({ error: 'Failed to create address.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const validationError = validateWriteRequest(request);
  if (validationError) return validationError;

  const auth = await authenticate(request);
  if (auth.response) return auth.response;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid address update.' }, { status: 400 });
  }

  try {
    const existing = await db.address.findFirst({
      where: { id: parsed.data.id, userId: auth.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
    }

    const { id, ...changes } = parsed.data;
    const address = await db.$transaction(async (tx) => {
      if (changes.isDefault) {
        await tx.address.updateMany({
          where: { userId: auth.user.id, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          ...changes,
          label: changes.label === undefined ? undefined : changes.label || 'Home',
          address2:
            changes.address2 === undefined ? undefined : changes.address2 || null,
          state: changes.state === undefined ? undefined : changes.state || null,
          postalCode:
            changes.postalCode === undefined ? undefined : changes.postalCode || null,
        },
      });
    });

    return NextResponse.json({ address: mapAddress(address) });
  } catch (error) {
    console.error('Addresses PUT error:', error);
    return NextResponse.json({ error: 'Failed to update address.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const validationError = validateWriteRequest(request);
  if (validationError) return validationError;

  const auth = await authenticate(request);
  if (auth.response) return auth.response;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Address id is required.' }, { status: 400 });
  }

  try {
    const deleted = await db.address.deleteMany({
      where: { id, userId: auth.user.id },
    });
    if (deleted.count !== 1) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Addresses DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete address.' }, { status: 500 });
  }
}
