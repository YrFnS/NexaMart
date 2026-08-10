-- Align the deployed PostgreSQL defaults with the committed Prisma model.
-- These are catalog-only changes and do not rewrite existing rows.

ALTER TABLE "ProductVariant"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "ReplacementShipment"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "Return"
  ALTER COLUMN "resolution" SET DEFAULT 'return_only';
