import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/auth';
import { checkApiRateLimit, RATE_LIMITS, validateEnum } from '@/lib/security';

const VALID_INVOICE_STATUSES = ['paid', 'unpaid', 'overdue'] as const;

const invoiceInclude = {
  order: {
    select: {
      orderNumber: true,
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
  },
  seller: {
    select: {
      name: true,
      store: { select: { name: true, nameAr: true } },
    },
  },
  buyer: { select: { name: true, email: true } },
} as const;

export async function GET(request: NextRequest) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.general);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const auth = await requireAuthenticatedUser(request);
  if (auth.response || !auth.user) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const invoiceId = searchParams.get('id');
    const sellerId = searchParams.get('sellerId');
    const buyerId = searchParams.get('buyerId');
    const statusRaw = searchParams.get('status');
    const status = statusRaw
      ? validateEnum(statusRaw, [...VALID_INVOICE_STATUSES])
      : undefined;

    if (statusRaw && !status) {
      return NextResponse.json({ error: 'Invalid invoice status' }, { status: 400 });
    }

    const accessFilter =
      auth.user.role === 'admin'
        ? {}
        : { OR: [{ buyerId: auth.user.id }, { sellerId: auth.user.id }] };

    if (orderId || invoiceId) {
      const invoice = await db.invoice.findFirst({
        where: {
          ...(orderId ? { orderId } : { id: invoiceId as string }),
          ...accessFilter,
        },
        include: invoiceInclude,
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const response = NextResponse.json(
        mapInvoice(invoice, invoice.order, invoice.seller.store),
      );
      response.headers.set('Cache-Control', 'private, no-store');
      return response;
    }

    const where: Record<string, unknown> = { ...accessFilter };
    if (sellerId) where.sellerId = sellerId;
    if (buyerId) where.buyerId = buyerId;
    if (status) where.status = status;

    const invoices = await db.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const mapped = invoices.map(invoice =>
      mapInvoice(invoice, invoice.order, invoice.seller.store),
    );

    const response = NextResponse.json({ invoices: mapped, total: mapped.length });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('Invoices API error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

function mapInvoice(
  invoice: Record<string, unknown>,
  order: Record<string, unknown>,
  store: Record<string, unknown> | null,
) {
  const items =
    (order?.items as Array<Record<string, unknown>>)?.map(item => ({
      productId: item.productId as string,
      name: (item.product as Record<string, unknown>)?.name || '',
      quantity: item.quantity as number,
      unitPrice: Number(item.price),
      lineTotal: Number(item.total),
    })) || [];

  const buyer = (invoice.buyer as Record<string, unknown>) || {};
  const createdAt = invoice.createdAt as Date;
  const dueDate = invoice.dueDate as Date | null;

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    orderId: invoice.orderId,
    orderNumber: order?.orderNumber || '',
    invoiceDate: createdAt.toISOString().split('T')[0],
    dueDate: (dueDate || createdAt).toISOString().split('T')[0],
    seller: {
      storeName: store?.name || '',
      storeNameAr: store?.nameAr || '',
      address: '',
      addressAr: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      taxId: (invoice.taxId as string) || undefined,
    },
    buyer: {
      name: buyer.name || '',
      email: buyer.email || '',
      phone: '',
      address: '',
      addressAr: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    items,
    subtotal: Number(invoice.subtotal),
    taxRate: 0,
    taxAmount: Number(invoice.tax),
    shippingCost: Number(invoice.shipping),
    discount: Number(invoice.discount),
    grandTotal: Number(invoice.total),
    currency: 'USD',
    paymentMethod: (invoice.paymentMethod as string) || '',
    paymentMethodAr: '',
    paymentStatus: invoice.status === 'paid' ? 'paid' : 'unpaid',
  };
}
