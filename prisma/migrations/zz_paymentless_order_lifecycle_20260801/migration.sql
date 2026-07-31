ALTER TABLE "Order"
  ADD COLUMN "confirmationExpiresAt" TIMESTAMP(3),
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "preparingAt" TIMESTAMP(3),
  ADD COLUMN "shippedAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "rejectedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledBy" TEXT,
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "inventoryRestoredAt" TIMESTAMP(3);

CREATE TABLE "OrderStatusEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorRole" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OrderStatusEvent"
  ADD CONSTRAINT "OrderStatusEvent_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "OrderStatusEvent_orderId_createdAt_idx"
  ON "OrderStatusEvent"("orderId", "createdAt");

CREATE INDEX "Order_status_confirmationExpiresAt_idx"
  ON "Order"("status", "confirmationExpiresAt");

UPDATE "Order"
  SET "confirmationExpiresAt" = "createdAt" + INTERVAL '24 hours'
  WHERE "status" = 'pending' AND "confirmationExpiresAt" IS NULL;

INSERT INTO "OrderStatusEvent" (
  "id", "orderId", "fromStatus", "toStatus", "actorId", "actorRole", "note", "createdAt"
)
SELECT
  'legacy_' || md5("id"),
  "id",
  NULL,
  "status",
  "userId",
  'system',
  'Imported existing order state',
  "createdAt"
FROM "Order";
