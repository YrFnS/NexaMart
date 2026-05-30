import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/security';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ addresses: [], total: 0 });
    }

    const addresses = await db.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });

    return Response.json({ addresses, total: addresses.length });
  } catch (error) {
    console.error('Addresses API error:', error);
    return Response.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, label, fullName, phone, address1, address2, city, state, postalCode, country, isDefault } = body;

    if (!userId || !fullName || !phone || !address1 || !city) {
      return Response.json(
        { error: 'Missing required fields: userId, fullName, phone, address1, city' },
        { status: 400 }
      );
    }

    // Sanitize string inputs to prevent XSS
    const safeFullName = sanitizeString(String(fullName));
    const safePhone = sanitizeString(String(phone));
    const safeAddress1 = sanitizeString(String(address1));
    const safeAddress2 = address2 ? sanitizeString(String(address2)) : null;
    const safeCity = sanitizeString(String(city));
    const safeState = state ? sanitizeString(String(state)) : null;
    const safeLabel = label ? sanitizeString(String(label)) : 'Home';

    // If this is set as default, unset other defaults
    if (isDefault) {
      await db.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await db.address.create({
      data: {
        userId,
        label: safeLabel,
        fullName: safeFullName,
        phone: safePhone,
        address1: safeAddress1,
        address2: safeAddress2,
        city: safeCity,
        state: safeState,
        postalCode: postalCode || null,
        country: country || 'Iraq',
        isDefault: isDefault || false,
      },
    });

    return Response.json({ address, message: 'Address created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Create Address API error:', error);
    return Response.json({ error: 'Failed to create address' }, { status: 500 });
  }
}
