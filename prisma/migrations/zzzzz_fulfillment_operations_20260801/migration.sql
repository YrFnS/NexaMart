-- Operational fulfilment records for the paymentless marketplace.
-- Seller-only notes stay separate from buyer notes, returned inventory receives
-- one immutable disposition, and exchange replacements reserve exact SKU stock.

ALTER TABLE "Order"
  ADD COLUMN "sellerFulfillmentNote" TEXT,
  ADD COLUMN "packingSlipGeneratedAt" TIMESTAMP(3),
  ADD COLUMN "packingSlipGeneratedBy" TEXT;

ALTER TABLE "Return"
  ADD COLUMN "inventoryDisposition" TEXT,
  ADD COLUMN "inventoryDispositionAt" TIMESTAMP(3),
  ADD COLUMN "inventoryDispositionBy" TEXT,
  ADD COLUMN "inventoryRestoredAt" TIMESTAMP(3);

ALTER TABLE "Return"
  ADD CONSTRAINT "Return_inventoryDisposition_check"
  CHECK (
    "inventoryDisposition" IS NULL OR
    "inventoryDisposition" IN ('restock', 'quarantine', 'discard')
  );

CREATE TABLE "ReplacementShipment" (
  "id" TEXT NOT NULL,
  "returnId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "orderItemId" TEXT,
  "productId" TEXT NOT NULL,
  "variantId" TEXT,
  "buyerId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "sku" TEXT,
  "quantity" INTEGER NOT NULL,
  "carrier" TEXT,
  "trackingNumber" TEXT,
  "status" TEXT NOT NULL DEFAULT 'preparing',
  "notes" TEXT,
  "inventoryReservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "inventoryRestoredAt" TIMESTAMP(3),
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReplacementShipment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReplacementShipment_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "ReplacementShipment_status_check" CHECK (
    "status" IN ('preparing', 'shipped', 'delivered', 'cancelled')
  ),
  CONSTRAINT "ReplacementShipment_tracking_check" CHECK (
    "status" NOT IN ('shipped', 'delivered') OR
    (
      NULLIF(BTRIM("carrier"), '') IS NOT NULL AND
      NULLIF(BTRIM("trackingNumber"), '') IS NOT NULL
    )
  )
);

CREATE UNIQUE INDEX "ReplacementShipment_returnId_key"
  ON "ReplacementShipment"("returnId");
CREATE INDEX "ReplacementShipment_sellerId_status_idx"
  ON "ReplacementShipment"("sellerId", "status");
CREATE INDEX "ReplacementShipment_buyerId_createdAt_idx"
  ON "ReplacementShipment"("buyerId", "createdAt");
CREATE INDEX "ReplacementShipment_storeId_status_idx"
  ON "ReplacementShipment"("storeId", "status");
CREATE INDEX "ReplacementShipment_productId_idx"
  ON "ReplacementShipment"("productId");
CREATE INDEX "ReplacementShipment_variantId_idx"
  ON "ReplacementShipment"("variantId");

ALTER TABLE "ReplacementShipment"
  ADD CONSTRAINT "ReplacementShipment_returnId_fkey"
  FOREIGN KEY ("returnId") REFERENCES "Return"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReplacementShipment"
  ADD CONSTRAINT "ReplacementShipment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReplacementShipment"
  ADD CONSTRAINT "ReplacementShipment_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReplacementShipment"
  ADD CONSTRAINT "ReplacementShipment_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReplacementShipment"
  ADD CONSTRAINT "ReplacementShipment_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReplacementShipment"
  ADD CONSTRAINT "ReplacementShipment_buyerId_fkey"
  FOREIGN KEY ("buyerId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReplacementShipment"
  ADD CONSTRAINT "ReplacementShipment_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReplacementShipment"
  ADD CONSTRAINT "ReplacementShipment_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
