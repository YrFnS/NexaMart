import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { validateEnum, validatePagination } from '@/lib/security';

const invoiceInclude = {
  order: {
    select: {
      orderNumber: true,
      shippingAddress: true,
      items: {
        include: {
          product: { select: { id: true, name: true, nameAr: true } },
        },
      },
    },
  },
  seller: {
    select: {
      name: true,
      email: true,
      phone: true,
      store: { select: { name: true, nameAr: true, location: true } },
    },
  },
  buyer: { select: { name: true, email: true, phone: true } },
} satisfies Prisma.InvoiceInclude;

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: typeof invoiceInclude;
}>;

const VALID_STATUSES = ['paid', 'unpaid', 'overdue'] as const;

function parseAddress(value: string | null) {
  if (!value) return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, item]) => [key, item == null ? '' : String(item)]),
    );
  } catch {
    return { address1: value };
  }
}

function mapInvoice(invoice: InvoiceWithRelations) {
  const shippingAddress = parseAddress(invoice.order.shippingAddress);
  const sellerStore = invoice.seller.store;

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    orderId: invoice.orderId,
    orderNumber: invoice.order.orderNumber,
    invoiceDate: invoice.createdAt.toISOString().slice(0, 10),
    dueDate: (invoice.dueDate || invoice.createdAt).toISOString().slice(0, 10),
    seller: {
      storeName: sellerStore?.name || invoice.seller.name || '',
      storeNameAr: sellerStore?.nameAr || '',
      address: sellerStore?.location || '',
      addressAr: sellerStore?.location || '',
      city: '',
      country: '',
      phone: invoice.seller.phone || '',
      email: invoice.seller.email,
      taxId: invoice.taxId || undefined,
    },
    buyer: {
      name: invoice.buyer.name || invoice.buyer.email,
      email: invoice.buyer.email,
      phone: invoice.buyer.phone || shippingAddress.phone || '',
      address: shippingAddress.address1 || '',
      addressAr: shippingAddress.address1 || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      postalCode: shippingAddress.postalCode || '',
      country: shippingAddress.country || '',
    },
    items: invoice.order.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      nameAr: item.product.nameAr,
      quantity: item.quantity,
      unitPrice: Number(item.price),
      lineTotal: Number(item.total),
    })),
    subtotal: Number(invoice.subtotal),
    taxRate: 0,
    taxAmount: Number(invoice.tax),
    shippingCost: Number(invoice.shipping),
    discount: Number(invoice.discount),
    grandTotal: Number(invoice.total),
    currency: 'USD',
    paymentMethod: invoice.paymentMethod || '',
    paymentMethodAr: '',
    paymentStatus: invoice.status === 'paid' ? 'paid' : 'unpaid',
  };
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const invoiceId = searchParams.get('id');
    const requestedSellerId = searchParams.get('sellerId');
    const requestedBuyerId = searchParams.get('buyerId');
    const statusRaw = searchParams.get('status');
    const status = statusRaw ? validateEnum(statusRaw, VALID_STATUSES) : null;
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100,
    );

    if (statusRaw && !status) {
      return NextResponse.json({ error: 'Invalid invoice status.' }, { status: 400 });
    }

    const ownership: Prisma.InvoiceWhereInput =
      auth.user.role === 'admin'
        ? {}
        : auth.user.role === 'seller'
          ? { sellerId: auth.user.id }
          : { buyerId: auth.user.id };

    if (invoiceId || orderId) {
      const invoice = await db.invoice.findFirst({
        where: {
          AND: [
            ownership,
            invoiceId ? { id: invoiceId } : { orderId: orderId || undefined },
          ],
        },
        include: invoiceInclude,
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
      }
      return NextResponse.json(mapInvoice(invoice));
    }

    const filters: Prisma.InvoiceWhereInput[] = [ownership];
    if (status) filters.push({ status });
    if (auth.user.role === 'admin' && requestedSellerId) {
      filters.push({ sellerId: requestedSellerId });
    }
    if (auth.user.role === 'admin' && requestedBuyerId) {
      filters.push({ buyerId: requestedBuyerId });
    }
    const where: Prisma.InvoiceWhereInput = { AND: filters };

    const [invoices, total] = await db.$transaction([
      db.invoice.findMany({
        where,
        include: invoiceInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices: invoices.map(mapInvoice),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Invoices API error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices.' }, { status: 500 });
  }
}
