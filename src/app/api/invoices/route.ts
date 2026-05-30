import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const invoiceId = searchParams.get('id');
    const sellerId = searchParams.get('sellerId');
    const buyerId = searchParams.get('buyerId');
    const status = searchParams.get('status');

    // Get specific invoice by order ID
    if (orderId) {
      const invoice = await db.invoice.findFirst({
        where: { orderId },
        include: {
          order: {
            select: { orderNumber: true, items: { include: { product: { select: { name: true } } } } },
          },
          seller: { select: { name: true, store: { select: { name: true, nameAr: true } } } },
          buyer: { select: { name: true, email: true } },
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found for this order' }, { status: 404 });
      }

      const sellerStore = await db.store.findFirst({ where: { ownerId: invoice.sellerId } });
      const mappedInvoice = mapInvoice(invoice, invoice.order, sellerStore);
      return NextResponse.json(mappedInvoice);
    }

    // Get specific invoice by invoice ID
    if (invoiceId) {
      const invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          order: {
            select: { orderNumber: true, items: { include: { product: { select: { name: true } } } } },
          },
          seller: { select: { name: true, store: { select: { name: true, nameAr: true } } } },
          buyer: { select: { name: true, email: true } },
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const sellerStore = await db.store.findFirst({ where: { ownerId: invoice.sellerId } });
      const mappedInvoice = mapInvoice(invoice, invoice.order, sellerStore);
      return NextResponse.json(mappedInvoice);
    }

    // List invoices with optional filters
    const where: Record<string, unknown> = {};
    if (sellerId) where.sellerId = sellerId;
    if (buyerId) where.buyerId = buyerId;
    if (status) where.status = status;

    const invoices = await db.invoice.findMany({
      where,
      include: {
        order: {
          select: { orderNumber: true, items: { include: { product: { select: { name: true } } } } },
        },
        seller: { select: { name: true } },
        buyer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = await Promise.all(invoices.map(async (inv) => {
      const sellerStore = await db.store.findFirst({ where: { ownerId: inv.sellerId } });
      return mapInvoice(inv, inv.order, sellerStore);
    }));

    return NextResponse.json({
      invoices: mapped,
      total: mapped.length,
    });
  } catch (error) {
    console.error('Invoices API error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

function mapInvoice(invoice: Record<string, unknown>, order: Record<string, unknown>, store: Record<string, unknown> | null) {
  const items = (order?.items as Array<Record<string, unknown>>)?.map((item) => ({
    productId: item.productId as string,
    name: (item.product as Record<string, unknown>)?.name || '',
    quantity: item.quantity as number,
    unitPrice: item.price as number,
    lineTotal: item.total as number,
  })) || [];

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    orderId: invoice.orderId,
    orderNumber: order?.orderNumber || '',
    invoiceDate: (invoice.createdAt as Date).toISOString().split('T')[0],
    dueDate: (invoice.dueDate as Date)?.toISOString().split('T')[0] || (invoice.createdAt as Date).toISOString().split('T')[0],
    seller: {
      storeName: store?.name || '',
      storeNameAr: store?.nameAr || '',
      address: '',
      addressAr: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      taxId: (invoice as Record<string, unknown>).taxId as string || undefined,
    },
    buyer: {
      name: ((invoice as Record<string, unknown>).buyer as Record<string, unknown>)?.name || '',
      email: ((invoice as Record<string, unknown>).buyer as Record<string, unknown>)?.email || '',
      phone: '',
      address: '',
      addressAr: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    items,
    subtotal: invoice.subtotal as number,
    taxRate: 0,
    taxAmount: invoice.tax as number,
    shippingCost: invoice.shipping as number,
    discount: invoice.discount as number,
    grandTotal: invoice.total as number,
    currency: 'USD',
    paymentMethod: (invoice as Record<string, unknown>).paymentMethod as string || '',
    paymentMethodAr: '',
    paymentStatus: (invoice as Record<string, unknown>).status === 'paid' ? 'paid' : 'unpaid',
  };
}
