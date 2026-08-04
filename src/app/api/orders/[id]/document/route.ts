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

type PrintableAddressLine = {
  value: string;
  direction: 'auto' | 'ltr';
};

const ORDER_STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  pending: { en: 'Pending confirmation', ar: 'بانتظار التأكيد' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  preparing: { en: 'Preparing', ar: 'قيد التجهيز' },
  processing: { en: 'Processing', ar: 'قيد المعالجة' },
  shipped: { en: 'Shipped', ar: 'تم الشحن' },
  delivered: { en: 'Delivered', ar: 'تم التسليم' },
  rejected: { en: 'Rejected', ar: 'مرفوض' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
  disputed: { en: 'Disputed', ar: 'متنازع عليه' },
  returned: { en: 'Returned', ar: 'مرتجع' },
};

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

function formatDiscount(value: unknown, currency: string, isRTL: boolean): string {
  const amount = Math.max(0, Number(value));
  if (amount === 0) return formatMoney(0, currency, isRTL);
  return `-${formatMoney(amount, currency, isRTL)}`;
}

function orderStatusLabel(status: string, isRTL: boolean): string {
  const label = ORDER_STATUS_LABELS[status];
  if (label) return isRTL ? label.ar : label.en;
  return status.replaceAll('_', ' ');
}

function isPhoneLike(value: string): boolean {
  return /^[+\d\s().-]+$/.test(value.trim());
}

function addressLines(order: DocumentOrder): PrintableAddressLine[] {
  const address = parseObject(order.shippingAddress);
  const locality = [address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(', ');
  const values = [
    address.name || address.fullName || order.user.name || order.user.email,
    address.address1,
    address.address2,
    locality,
    address.country,
    address.phone || order.user.phone || '',
  ].filter(Boolean);

  return values.map((value) => ({
    value,
    direction: isPhoneLike(value) ? 'ltr' : 'auto',
  }));
}

function optionKeyLabel(key: string, isRTL: boolean): string {
  if (!isRTL) return key;
  const normalized = key.trim().toLowerCase();
  const labels: Record<string, string> = {
    color: 'اللون',
    colour: 'اللون',
    size: 'المقاس',
    material: 'المادة',
    storage: 'السعة',
    style: 'النمط',
    model: 'الطراز',
  };
  return labels[normalized] || key;
}

function optionText(
  orderItem: DocumentOrder['items'][number],
  isRTL: boolean,
): string {
  const values = orderItem.variant
    ? parseObject(orderItem.variant.attributes)
    : parseObject(orderItem.variation);
  return Object.entries(values)
    .map(([key, value]) => `${optionKeyLabel(key, isRTL)}: ${value}`)
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
  const moneyDirection = isRTL ? 'auto' : 'ltr';
  const itemRows = order.items
    .map((item, index) => {
      const name =
        (isRTL ? item.product.nameAr : item.product.name) || item.product.name;
      const options = optionText(item, isRTL);
      return `
        <tr>
          <td class="index"><bdi dir="ltr">${index + 1}</bdi></td>
          <td>
            <strong dir="auto">${escapeHtml(name)}</strong>
            ${
              options
                ? `<div class="muted" dir="auto">${escapeHtml(options)}</div>`
                : ''
            }
          </td>
          <td class="sku"><bdi dir="ltr">${escapeHtml(item.variant?.sku || '—')}</bdi></td>
          <td class="number"><bdi dir="ltr">${item.quantity}</bdi></td>
          ${
            packingSlip
              ? ''
              : `<td class="number"><bdi dir="${moneyDirection}">${escapeHtml(
                  formatMoney(item.price, order.currency, isRTL),
                )}</bdi></td>
                 <td class="number"><bdi dir="${moneyDirection}">${escapeHtml(
                   formatMoney(item.total, order.currency, isRTL),
                 )}</bdi></td>`
          }
        </tr>`;
    })
    .join('');

  const totals = packingSlip
    ? ''
    : `
      <dl class="totals" aria-label="${isRTL ? 'إجماليات الطلب' : 'Order totals'}">
        <div><dt>${isRTL ? 'المجموع الفرعي' : 'Subtotal'}</dt><dd><bdi dir="${moneyDirection}">${escapeHtml(
          formatMoney(order.subtotal, order.currency, isRTL),
        )}</bdi></dd></div>
        <div><dt>${isRTL ? 'الشحن' : 'Shipping'}</dt><dd><bdi dir="${moneyDirection}">${escapeHtml(
          formatMoney(order.shippingCost, order.currency, isRTL),
        )}</bdi></dd></div>
        <div><dt>${isRTL ? 'الخصم' : 'Discount'}</dt><dd><bdi dir="${moneyDirection}">${escapeHtml(
          formatDiscount(order.discount, order.currency, isRTL),
        )}</bdi></dd></div>
        <div><dt>${isRTL ? 'الضريبة' : 'Tax'}</dt><dd><bdi dir="${moneyDirection}">${escapeHtml(
          formatMoney(order.tax, order.currency, isRTL),
        )}</bdi></dd></div>
        <div class="grand"><dt>${isRTL ? 'الإجمالي' : 'Total'}</dt><dd><bdi dir="${moneyDirection}">${escapeHtml(
          formatMoney(order.total, order.currency, isRTL),
        )}</bdi></dd></div>
      </dl>`;

  const colgroup = packingSlip
    ? `<colgroup>
        <col class="index-col" />
        <col class="item-col" />
        <col class="sku-col" />
        <col class="qty-col" />
      </colgroup>`
    : `<colgroup>
        <col class="index-col" />
        <col class="item-col" />
        <col class="sku-col" />
        <col class="qty-col" />
        <col class="price-col" />
        <col class="total-col" />
      </colgroup>`;

  return `<!doctype html>
<html lang="${isRTL ? 'ar' : 'en'}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} · ${escapeHtml(order.orderNumber)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    :root { font-family: Arial, "Noto Sans Arabic", sans-serif; color: #171717; }
    * { box-sizing: border-box; }
    html { background: white; }
    body { margin: 0; background: #f5f5f4; line-height: 1.45; }
    main { width: min(900px, calc(100% - 32px)); margin: 24px auto; background: white; padding: 32px; border: 1px solid #e7e5e4; border-radius: 16px; }
    header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 2px solid #d97706; padding-bottom: 20px; }
    h1 { margin: 0; font-size: 26px; line-height: 1.2; }
    h2 { margin: 0 0 8px; font-size: 15px; }
    p { margin: 4px 0; }
    .brand { color: #b45309; font-weight: 800; letter-spacing: .02em; }
    .meta { min-width: 250px; margin: 0; font-size: 13px; }
    .meta div { display: flex; justify-content: flex-end; gap: 5px; margin: 4px 0; }
    .meta dt { font-weight: 700; }
    .meta dd { margin: 0; }
    [dir="rtl"] .meta div { justify-content: flex-start; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin: 24px 0; }
    .box { border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; }
    address { font-style: normal; }
    .muted { color: #78716c; font-size: 12px; margin-top: 4px; }
    .ltr, bdi[dir="ltr"] { direction: ltr; unicode-bidi: isolate; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 20px; }
    table .index-col { width: 6%; }
    table .qty-col { width: 10%; }
    table .sku-col { width: 22%; }
    table.order-table .item-col { width: 28%; }
    table.order-table .price-col { width: 16%; }
    table.order-table .total-col { width: 18%; }
    table.packing-table .item-col { width: 57%; }
    table.packing-table .sku-col { width: 25%; }
    table.packing-table .qty-col { width: 12%; }
    caption { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th, td { border-bottom: 1px solid #e7e5e4; padding: 11px 8px; text-align: start; vertical-align: top; font-size: 13px; overflow-wrap: anywhere; }
    th { background: #fffbeb; color: #92400e; font-size: 12px; }
    .index { white-space: nowrap; }
    .sku, .number { text-align: end; white-space: nowrap; }
    .totals { width: min(360px, 100%); margin: 24px 0 0 auto; }
    [dir="rtl"] .totals { margin: 24px auto 0 0; }
    .totals div { display: flex; justify-content: space-between; gap: 24px; padding: 7px 0; }
    .totals dt { font-weight: 400; }
    .totals dd { margin: 0; font-weight: 700; }
    .totals .grand { border-top: 2px solid #d97706; margin-top: 6px; padding-top: 12px; font-size: 18px; }
    .notice { margin-top: 24px; border: 1px solid #fcd34d; background: #fffbeb; color: #78350f; border-radius: 12px; padding: 14px; font-size: 13px; }
    footer { margin-top: 28px; color: #78716c; font-size: 11px; text-align: center; }
    @media (max-width: 640px) { main { width: 100%; margin: 0; border: 0; border-radius: 0; padding: 20px; } header { flex-direction: column; } .meta { min-width: 0; } .meta div, [dir="rtl"] .meta div { justify-content: flex-start; } .grid { grid-template-columns: 1fr; } }
    @media print {
      html, body { background: white; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      main { width: 100%; margin: 0; border: 0; border-radius: 0; padding: 0; }
      header, .grid, .box, .totals, .notice, footer { break-inside: avoid; page-break-inside: avoid; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <main>
    <header aria-labelledby="document-title">
      <div>
        <div class="brand">NexaMart</div>
        <h1 id="document-title">${escapeHtml(title)}</h1>
        <p dir="auto">${escapeHtml(sellerName)}</p>
      </div>
      <dl class="meta">
        <div><dt>${isRTL ? 'رقم الطلب' : 'Order'}:</dt><dd><bdi dir="ltr">${escapeHtml(order.orderNumber)}</bdi></dd></div>
        <div><dt>${isRTL ? 'التاريخ' : 'Date'}:</dt><dd><time datetime="${escapeHtml(order.createdAt.toISOString())}">${escapeHtml(
          new Intl.DateTimeFormat(isRTL ? 'ar-IQ' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(order.createdAt),
        )}</time></dd></div>
        <div><dt>${isRTL ? 'الحالة' : 'Status'}:</dt><dd>${escapeHtml(
          orderStatusLabel(order.status, isRTL),
        )}</dd></div>
      </dl>
    </header>

    <section class="grid" aria-label="${isRTL ? 'بيانات الشحن والبائع' : 'Shipping and seller details'}">
      <div class="box">
        <h2>${isRTL ? 'الشحن إلى' : 'Ship to'}</h2>
        <address>
          ${addressLines(order)
            .map(
              (line) =>
                `<p><bdi dir="${line.direction}">${escapeHtml(line.value)}</bdi></p>`,
            )
            .join('')}
        </address>
      </div>
      <div class="box">
        <h2>${isRTL ? 'البائع' : 'Seller'}</h2>
        <p dir="auto">${escapeHtml(sellerName)}</p>
        ${order.store?.location ? `<p dir="auto">${escapeHtml(order.store.location)}</p>` : ''}
        <p>${isRTL ? 'الدفع للبائع عند الاستلام' : 'Pay the seller on delivery'}</p>
      </div>
    </section>

    <table class="${packingSlip ? 'packing-table' : 'order-table'}">
      <caption>${isRTL ? 'عناصر الطلب' : 'Order items'}</caption>
      ${colgroup}
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">${isRTL ? 'المنتج' : 'Item'}</th>
          <th scope="col">SKU</th>
          <th scope="col" class="number">${isRTL ? 'الكمية' : 'Qty'}</th>
          ${
            packingSlip
              ? ''
              : `<th scope="col" class="number">${isRTL ? 'السعر' : 'Price'}</th><th scope="col" class="number">${isRTL ? 'الإجمالي' : 'Line total'}</th>`
          }
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    ${totals}

    <div class="notice" role="note">
      ${
        isRTL
          ? '<bdi dir="ltr">NexaMart</bdi> لا يعالج أي دفعة لهذا الطلب. يتم الدفع مباشرةً للبائع عند الاستلام.'
          : 'NexaMart does not process payment for this order. Payment is made directly to the seller on delivery.'
      }
    </div>
    <footer>${
      isRTL
        ? 'مستند تم إنشاؤه من <bdi dir="ltr">NexaMart</bdi>'
        : 'Document generated by NexaMart'
    }</footer>
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
