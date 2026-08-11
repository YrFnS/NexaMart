-- Store fixed-window rate-limit counters in a schema outside Prisma's public
-- application model. The table is shared by every serverless instance.

CREATE SCHEMA "nexamart_internal";

CREATE TABLE "nexamart_internal"."RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimitBucket_resetAt_idx"
  ON "nexamart_internal"."RateLimitBucket"("resetAt");
