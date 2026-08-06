ALTER TABLE "Return"
  ADD COLUMN "orderItemId" TEXT,
  ADD COLUMN "variantId" TEXT,
  ADD COLUMN "sku" TEXT,
  ADD COLUMN "unitPrice" DOUBLE PRECISION,
  ADD COLUMN "offlineRefundStatus" TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN "offlineRefundConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "offlineRefundConfirmedBy" TEXT;

UPDATE "Return" AS r
SET
  "orderItemId" = (
    SELECT oi."id"
    FROM "OrderItem" AS oi
    WHERE oi."orderId" = r."orderId"
      AND oi."productId" = r."productId"
    ORDER BY oi."id"
    LIMIT 1
  ),
  "variantId" = (
    SELECT oi."variantId"
    FROM "OrderItem" AS oi
    WHERE oi."orderId" = r."orderId"
      AND oi."productId" = r."productId"
    ORDER BY oi."id"
    LIMIT 1
  ),
  "unitPrice" = (
    SELECT oi."price"
    FROM "OrderItem" AS oi
    WHERE oi."orderId" = r."orderId"
      AND oi."productId" = r."productId"
    ORDER BY oi."id"
    LIMIT 1
  ),
  "sku" = (
    SELECT pv."sku"
    FROM "OrderItem" AS oi
    LEFT JOIN "ProductVariant" AS pv ON pv."id" = oi."variantId"
    WHERE oi."orderId" = r."orderId"
      AND oi."productId" = r."productId"
    ORDER BY oi."id"
    LIMIT 1
  );

UPDATE "Return"
SET "resolution" = CASE
  WHEN "resolution" = 'refund' THEN 'offline_refund'
  WHEN "resolution" = 'store_credit' THEN 'return_only'
  ELSE "resolution"
END;

UPDATE "Return"
SET "offlineRefundStatus" = CASE
  WHEN "resolution" = 'offline_refund'
    AND "status" IN ('approved', 'processing', 'completed')
    THEN 'required'
  ELSE 'not_required'
END;

ALTER TABLE "Return"
  ADD CONSTRAINT "Return_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Return_orderItemId_status_idx"
  ON "Return"("orderItemId", "status");
