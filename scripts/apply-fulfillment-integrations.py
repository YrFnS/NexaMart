from __future__ import annotations

from pathlib import Path


def replace_once(
    source: str,
    old: str,
    new: str,
    *,
    label: str,
    guard: str,
) -> str:
    if guard in source:
        return source
    if old not in source:
        raise SystemExit(f"Could not locate {label} anchor")
    return source.replace(old, new, 1)


schema_path = Path("prisma/schema.prisma")
schema = schema_path.read_text()

schema = replace_once(
    schema,
    "  auditLogs        AuditLog[]\n\n  @@index([role])",
    "  auditLogs                    AuditLog[]\n"
    "  replacementShipmentsAsBuyer  ReplacementShipment[] @relation(\"ReplacementBuyer\")\n"
    "  replacementShipmentsAsSeller ReplacementShipment[] @relation(\"ReplacementSeller\")\n\n"
    "  @@index([role])",
    label="User replacement relations",
    guard="replacementShipmentsAsBuyer",
)

schema = replace_once(
    schema,
    "  staff      Staff[]\n\n  @@index([isVerified])",
    "  staff                Staff[]\n"
    "  replacementShipments ReplacementShipment[]\n\n"
    "  @@index([isVerified])",
    label="Store replacement relation",
    guard="replacementShipments ReplacementShipment[]",
)

schema = replace_once(
    schema,
    "  auctions      Auction[]\n  variantSkus   ProductVariant[]",
    "  auctions             Auction[]\n"
    "  variantSkus          ProductVariant[]\n"
    "  replacementShipments ReplacementShipment[]",
    label="Product replacement relation",
    guard="variantSkus          ProductVariant[]\n  replacementShipments",
)

schema = replace_once(
    schema,
    "  orderItems OrderItem[]\n\n  @@unique([productId, optionKey])",
    "  orderItems           OrderItem[]\n"
    "  replacementShipments ReplacementShipment[]\n\n"
    "  @@unique([productId, optionKey])",
    label="ProductVariant replacement relation",
    guard="orderItems           OrderItem[]\n  replacementShipments",
)

schema = replace_once(
    schema,
    "  inventoryRestoredAt  DateTime?\n  createdAt            DateTime @default(now())",
    "  inventoryRestoredAt      DateTime?\n"
    "  sellerFulfillmentNote    String?\n"
    "  packingSlipGeneratedAt   DateTime?\n"
    "  packingSlipGeneratedBy   String?\n"
    "  createdAt                DateTime @default(now())",
    label="Order fulfillment fields",
    guard="sellerFulfillmentNote",
)

schema = replace_once(
    schema,
    "  statusEvents OrderStatusEvent[]\n\n  @@unique([idempotencyKey, storeId])",
    "  statusEvents         OrderStatusEvent[]\n"
    "  replacementShipments ReplacementShipment[]\n\n"
    "  @@unique([idempotencyKey, storeId])",
    label="Order replacement relation",
    guard="statusEvents         OrderStatusEvent[]\n  replacementShipments",
)

schema = replace_once(
    schema,
    "  returns Return[]\n\n  @@index([variantId])",
    "  returns              Return[]\n"
    "  replacementShipments ReplacementShipment[]\n\n"
    "  @@index([variantId])",
    label="OrderItem replacement relation",
    guard="returns              Return[]\n  replacementShipments",
)

schema = replace_once(
    schema,
    "  offlineRefundConfirmedBy String?\n  sellerNote               String?",
    "  offlineRefundConfirmedBy String?\n"
    "  inventoryDisposition     String?\n"
    "  inventoryDispositionAt   DateTime?\n"
    "  inventoryDispositionBy   String?\n"
    "  inventoryRestoredAt      DateTime?\n"
    "  sellerNote               String?",
    label="Return disposition fields",
    guard="inventoryDisposition     String?",
)

schema = replace_once(
    schema,
    "  seller    User       @relation(\"ReturnSeller\", fields: [sellerId], references: [id])\n\n  @@index([buyerId, status])",
    "  seller              User                 @relation(\"ReturnSeller\", fields: [sellerId], references: [id])\n"
    "  replacementShipment ReplacementShipment?\n\n"
    "  @@index([buyerId, status])",
    label="Return replacement relation",
    guard="replacementShipment ReplacementShipment?",
)

replacement_model = '''model ReplacementShipment {
  id                    String   @id @default(cuid())
  returnId              String   @unique
  orderId               String
  orderItemId           String?
  productId             String
  variantId             String?
  buyerId               String
  sellerId              String
  storeId               String
  sku                   String?
  quantity              Int
  carrier               String?
  trackingNumber        String?
  status                String   @default("preparing") // preparing, shipped, delivered, cancelled
  notes                 String?
  inventoryReservedAt   DateTime @default(now())
  inventoryRestoredAt   DateTime?
  shippedAt             DateTime?
  deliveredAt           DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  return    Return          @relation(fields: [returnId], references: [id], onDelete: Cascade)
  order     Order           @relation(fields: [orderId], references: [id])
  orderItem OrderItem?      @relation(fields: [orderItemId], references: [id], onDelete: SetNull)
  product   Product         @relation(fields: [productId], references: [id])
  variant   ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  buyer     User            @relation("ReplacementBuyer", fields: [buyerId], references: [id])
  seller    User            @relation("ReplacementSeller", fields: [sellerId], references: [id])
  store     Store           @relation(fields: [storeId], references: [id])

  @@index([sellerId, status])
  @@index([buyerId, createdAt])
  @@index([storeId, status])
  @@index([productId])
  @@index([variantId])
}

'''
if "model ReplacementShipment" not in schema:
    marker = "model PriceAlert {"
    if marker not in schema:
        raise SystemExit("Could not locate PriceAlert model anchor")
    schema = schema.replace(marker, replacement_model + marker, 1)

schema_path.write_text(schema)

returns_path = Path("src/app/api/returns/route.ts")
returns_source = returns_path.read_text()

returns_source = replace_once(
    returns_source,
    "  seller: { select: { id: true, name: true, email: true } },\n} satisfies Prisma.ReturnInclude;",
    "  seller: { select: { id: true, name: true, email: true } },\n"
    "  replacementShipment: true,\n"
    "} satisfies Prisma.ReturnInclude;",
    label="return replacement include",
    guard="replacementShipment: true",
)

replacement_serialization = '''    replacementShipment: record.replacementShipment
      ? {
          id: record.replacementShipment.id,
          status: record.replacementShipment.status,
          carrier: record.replacementShipment.carrier,
          trackingNumber: record.replacementShipment.trackingNumber,
          quantity: record.replacementShipment.quantity,
          sku: record.replacementShipment.sku,
          shippedAt:
            record.replacementShipment.shippedAt?.toISOString() || null,
          deliveredAt:
            record.replacementShipment.deliveredAt?.toISOString() || null,
          createdAt: record.replacementShipment.createdAt.toISOString(),
          updatedAt: record.replacementShipment.updatedAt.toISOString(),
        }
      : null,
'''
returns_source = replace_once(
    returns_source,
    "    sellerNote: record.sellerNote || undefined,\n    timeline: parseArray(record.timeline),",
    "    sellerNote: record.sellerNote || undefined,\n"
    + replacement_serialization
    + "    timeline: parseArray(record.timeline),",
    label="return replacement serialization",
    guard="replacementShipment: record.replacementShipment",
)

old_completion = '''        if (
          targetStatus === 'completed' &&
          !canCompleteReturn(record.resolution, effectiveOfflineStatus)
        ) {
          throw new Error('OFFLINE_REFUND_CONFIRMATION_REQUIRED');
        }
'''
new_completion = '''        if (targetStatus === 'completed') {
          if (!canCompleteReturn(record.resolution, effectiveOfflineStatus)) {
            throw new Error('OFFLINE_REFUND_CONFIRMATION_REQUIRED');
          }
          if (
            ['return_only', 'exchange'].includes(record.resolution) &&
            !record.inventoryDisposition
          ) {
            throw new Error('RETURN_DISPOSITION_REQUIRED');
          }
          if (
            record.resolution === 'exchange' &&
            record.replacementShipment?.status !== 'delivered'
          ) {
            throw new Error('EXCHANGE_REPLACEMENT_REQUIRED');
          }
        }
'''
returns_source = replace_once(
    returns_source,
    old_completion,
    new_completion,
    label="return completion operational guard",
    guard="EXCHANGE_REPLACEMENT_REQUIRED",
)

returns_source = replace_once(
    returns_source,
    "      OFFLINE_REFUND_CONFIRMATION_REQUIRED: { status: 409, error: 'Confirm the offline refund before completing this return.' },\n",
    "      OFFLINE_REFUND_CONFIRMATION_REQUIRED: { status: 409, error: 'Confirm the offline refund before completing this return.' },\n"
    "      RETURN_DISPOSITION_REQUIRED: { status: 409, error: 'Record the returned item inventory disposition before completing this return.' },\n"
    "      EXCHANGE_REPLACEMENT_REQUIRED: { status: 409, error: 'Deliver the replacement shipment before completing this exchange.' },\n",
    label="return operational error map",
    guard="RETURN_DISPOSITION_REQUIRED: { status:",
)

returns_path.write_text(returns_source)

buyer_path = Path("src/components/buyer/returns-page.tsx")
buyer_source = buyer_path.read_text()

buyer_source = replace_once(
    buyer_source,
    "  Search,\n  XCircle,",
    "  Search,\n  Truck,\n  XCircle,",
    label="buyer replacement icon",
    guard="  Truck,\n  XCircle,",
)

replacement_type = '''  replacementShipment: {
    id: string;
    status: 'preparing' | 'shipped' | 'delivered' | 'cancelled';
    carrier: string | null;
    trackingNumber: string | null;
    quantity: number;
    sku: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
'''
buyer_source = replace_once(
    buyer_source,
    "  createdAt: string;\n  timeline: TimelineEntry[];\n}",
    "  createdAt: string;\n" + replacement_type + "  timeline: TimelineEntry[];\n}",
    label="buyer replacement type",
    guard="  replacementShipment: {",
)

replacement_block = '''                    {record.replacementShipment && (
                      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm dark:border-violet-900 dark:bg-violet-950/30">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-medium text-violet-800 dark:text-violet-300">
                            <Truck className="size-4" />
                            {isRTL ? 'شحنة المنتج البديل' : 'Replacement shipment'}
                          </div>
                          <Badge variant="outline">
                            {record.replacementShipment.status.replaceAll('_', ' ')}
                          </Badge>
                        </div>
                        <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                          <p>
                            <strong>{isRTL ? 'شركة الشحن' : 'Carrier'}:</strong>{' '}
                            {record.replacementShipment.carrier || '—'}
                          </p>
                          <p>
                            <strong>{isRTL ? 'رقم التتبع' : 'Tracking number'}:</strong>{' '}
                            {record.replacementShipment.trackingNumber || '—'}
                          </p>
                          <p>
                            <strong>{isRTL ? 'الكمية' : 'Quantity'}:</strong>{' '}
                            {record.replacementShipment.quantity}
                          </p>
                          <p>
                            <strong>SKU:</strong>{' '}
                            {record.replacementShipment.sku || record.sku || '—'}
                          </p>
                          {record.replacementShipment.shippedAt && (
                            <p>
                              <strong>{isRTL ? 'تاريخ الشحن' : 'Shipped'}:</strong>{' '}
                              {date(record.replacementShipment.shippedAt)}
                            </p>
                          )}
                          {record.replacementShipment.deliveredAt && (
                            <p>
                              <strong>{isRTL ? 'تاريخ التسليم' : 'Delivered'}:</strong>{' '}
                              {date(record.replacementShipment.deliveredAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
'''
buyer_source = replace_once(
    buyer_source,
    "                    {record.sellerNote && (\n",
    replacement_block + "                    {record.sellerNote && (\n",
    label="buyer replacement history block",
    guard="{isRTL ? 'شحنة المنتج البديل' : 'Replacement shipment'}",
)

buyer_path.write_text(buyer_source)

print("Fulfillment schema, return authority, and buyer history integrations applied.")
