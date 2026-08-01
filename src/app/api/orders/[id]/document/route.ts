import { Prisma } from '@prisma/client';
import { requireAuthenticatedUser, type AuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';

const documentOrderInclude = {
  user: {
    select: { id: true, name: true, email: true, phone: true },
  },
  store: {
    select: { id: true, name: true, nameAr: true, location: true },
  },
  items: {
    include: {
      product: {
        select: { id: true, name: true, nameAr: true },
      },
      variant: {
        select: { id: true, sku: true, attributes: true },
      },
    },
  },
} satisfies Prisma.OrderInclude;

type DocumentOrder = Prisma.OrderGetPayload<{
  include: typeof documentOrderInclude;
}>;

function storeAccessWhere(user: AuthenticatedUser): Prisma.StoreWhereInput {
  if (user.role === 'admin') return {};
  return {
    OR: [
      { ownerId: user.id },
      {
        staff: {
          some: {
            userId: user.id,
            status: 'active',
            role: { in: ['owner', 'manager', 'editor'] },
          },
        },
      },
    ],
  };
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function parseObject(value: string | null | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, item]) => [key, String(item ?? '')]),
    );
  } catch {
    return {};
  }
}

function formatMoney(value: unknown, currency: string, isRTL: boolean): string {
  return new Intl.NumberFormat(isRTL ? 'ar-IQ' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function addressLines(order: DocumentOrder): string[] {
  const address = parseObject(order.shippingAddress);
  const locality = [address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(', ');
  return [
    address.name || address.fullName || order.user.name || order.user.email,
    address.address1,
    address.address2,
    locality,
    address.country,
    address.phone || order.user.phone || '',
  ].filter(Boolean);
}

function optionText(orderItem: DocumentOrder['items'][number]): string {
  const values = orderItem.variant
    ? parseObject(orderItem.variant.attributes)
    : parseObject(orderItem.variation);
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');
}

function printableHtml(
  order: DocumentOrder,
  type: 'packing-slip' | 'order',
  isRTL: boolean,
  autoPrint: boolean,
): string {
  const packingSlip = type === 'packing-slip';
  const title = packingSlip
    ? isRTL
      ? 'قائمة تجهيز الطلب'
      : 'Packing slip'
    : isRTL
      ? 'مستند الطلب'
      : 'Order document';
  const sellerName =
    (isRTL ? order.store?.nameAr : order.store?.name) ||
    order.store?.name ||
    (isRTL ? 'المتجر' : 'Store');
  const itemRows = order.items
    .map((item, index) => {
      const name =
        (isRTL ? item.product.nameAr : item.product.name) || item.product.name;
      const options = optionText(item);
      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${escapeHtml(name)}</strong>
            ${options ? `<div class="muted">${escapeHtml(options)}</div>` : ''}
          </td>
          <td>${escapeHtml(item.variant?.sku || '—')}</td>
          <td class="number">${item.quantity}</td>
          ${
            packingSlip
              ? ''
              : `<td class="number">${escapeHtml(
                  formatMoney(item.price, order.currency, isRTL),
                )}</td>
                 <td class="number">${escapeHtml(
                   formatMoney(item.total, order.currency, isRTL),
                 )}</td>`
          }
        </tr>`;
    })
    .join('');

  const totals = packingSlip
    ? ''
    : `
      <section class="totals">
        <div><span>${isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span><strong>${escapeHtml(
          formatMoney(order.subtotal, order.currency, isRTL),
        )}</strong></div>
        <div><span>${isRTL ? 'الشحن' : 'Shipping'}</span><strong>${escapeHtml(
          formatMoney(order.shippingCost, order.currency, isRTL),
        )}</strong></div>
        <div><span>${isRTL ? 'الخصم' : 'Discount'}</span><strong>-${escapeHtml(
          formatMoney(order.discount, order.currency, isRTL),
        )}</strong></div>
        <div><span>${isRTL ? 'الضريبة' : 'Tax'}</span><strong>${escapeHtml(
          formatMoney(order.tax, order.currency, isRTL),
        )}</strong></div>
        <div class="grand"><span>${isRTL ? 'الإجمالي' : 'Total'}</span><strong>${escapeHtml(
          formatMoney(order.total, order.currency, isRTL),
        )}</strong></div>
      </section>`;

  return `<!doctype html>
<html lang="${isRTL ? 'ar' : 'en'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} · ${escapeHtml(order.orderNumber)}</title>
  <style>
    :root { font-family: Arial, "Noto Sans Arabic", sans-serif; color: #171717; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #f5f5f4; }
    main { width: min(900px, calc(100% - 32px)); margin: 24px auto; background: white; padding: 32px; border: 1px solid #e7e5e4; border-radius: 16px; }
    header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #d97706; padding-bottom: 20px; }
    h1 { margin: 0; font-size: 26px; }
    h2 { margin: 0 0 8px; font-size: 15px; }
    p { margin: 4px 0; }
    .brand { color: #b45309; font-weight: 800; letter-spacing: .02em; }
    .meta { text-align: ${isRTL ? 'left' : 'right'}; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin: 24px 0; }
    .box { border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; }
    .muted { color: #78716c; font-size: 12px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border-bottom: 1px solid #e7e5e4; padding: 11px 8px; text-align: start; vertical-align: top; font-size: 13px; }
    th { background: #fffbeb; color: #92400e; font-size: 12px; }
    .number { text-align: end; white-space: nowrap; }
    .totals { width: min(360px, 100%); margin: 24px 0 0 auto; }
    [dir="rtl"] .totals { margin: 24px auto 0 0; }
    .totals div { display: flex; justify-content: space-between; gap: 24px; padding: 7px 0; }
    .totals .grand { border-top: 2px solid #d97706; margin-top: 6px; padding-top: 12px; font-size: 18px; }
    .notice { margin-top: 24px; border: 1px solid #fcd34d; background: #fffbeb; color: #78350f; border-radius: 12px; padding: 14px; font-size: 13px; }
    footer { margin-top: 28px; color: #78716c; font-size: 11px; text-align: center; }
    @media (max-width: 640px) { main { width: 100%; margin: 0; border: 0; border-radius: 0; padding: 20px; } header { flex-direction: column; } .meta { text-align: start; } .grid { grid-template-columns: 1fr; } }
    @media print { body { background: white; } main { width: 100%; margin: 0; border: 0; border-radius: 0; padding: 12mm; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <div class="brand">NexaMart</div>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(sellerName)}</p>
      </div>
      <div class="meta">
        <p><strong>${isRTL ? 'رقم الطلب' : 'Order'}:</strong> ${escapeHtml(order.orderNumber)}</p>
        <p><strong>${isRTL ? 'التاريخ' : 'Date'}:</strong> ${escapeHtml(
          new Intl.DateTimeFormat(isRTL ? 'ar-IQ' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(order.createdAt),
        )}</p>
        <p><strong>${isRTL ? 'الحالة' : 'Status'}:</strong> ${escapeHtml(order.status)}</p>
      </div>
    </header>

    <section class="grid">
      <div class="box">
        <h2>${isRTL ? 'الشحن إلى' : 'Ship to'}</h2>
        ${addressLines(order).map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
      </div>
      <div class="box">
        <h2>${isRTL ? 'البائع' : 'Seller'}</h2>
        <p>${escapeHtml(sellerName)}</p>
        ${order.store?.location ? `<p>${escapeHtml(order.store.location)}</p>` : ''}
        <p>${isRTL ? 'الدفع للبائع عند الاستلام' : 'Pay the seller on delivery'}</p>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>${isRTL ? 'المنتج' : 'Item'}</th>
          <th>SKU</th>
          <th class="number">${isRTL ? 'الكمية' : 'Qty'}</th>
          ${
            packingSlip
              ? ''
              : `<th class="number">${isRTL ? 'السعر' : 'Price'}</th><th class="number">${isRTL ? 'الإجمالي' : 'Line total'}</th>`
          }
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    ${totals}

    <div class="notice">
      ${
        isRTL
          ? 'NexaMart لا يعالج أي دفعة لهذا الطلب. يتم الدفع مباشرةً للبائع عند الاستلام.'
          : 'NexaMart does not process payment for this order. Payment is made directly to the seller on delivery.'
      }
    </div>
    <footer>${isRTL ? 'مستند تم إنشاؤه من NexaMart' : 'Document generated by NexaMart'}</footer>
  </main>
  ${autoPrint ? '<script>window.addEventListener("load", () => window.print());</script>' : ''}
</body>
</html>`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const url = new URL(request.url);
  const typeRaw = url.searchParams.get('type') || 'order';
  if (typeRaw !== 'order' && typeRaw !== 'packing-slip') {
    return Response.json({ error: 'Invalid document type.' }, { status: 400 });
  }
  if (typeRaw === 'packing-slip' && auth.user.role === 'buyer') {
    return Response.json(
      { error: 'Seller access is required for packing slips.' },
      { status: 403 },
    );
  }

  const ownership: Prisma.OrderWhereInput =
    auth.user.role === 'admin'
      ? {}
      : auth.user.role === 'buyer'
        ? { userId: auth.user.id }
        : { store: { is: storeAccessWhere(auth.user) } };

  const order = await db.order.findFirst({
    where: { AND: [{ id }, ownership] },
    include: documentOrderInclude,
  });
  if (!order) {
    return Response.json({ error: 'Order not found.' }, { status: 404 });
  }

  const isRTL = url.searchParams.get('lang') === 'ar';
  const autoPrint = url.searchParams.get('print') === '1';
  const html = printableHtml(order, typeRaw, isRTL, autoPrint);
  const response = new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `inline; filename="${typeRaw}-${order.orderNumber}.html"`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'self'",
    },
  });
  return response;
}
