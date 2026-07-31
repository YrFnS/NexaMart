-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "attributes" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_optionKey_key" ON "ProductVariant"("productId", "optionKey");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_isActive_idx" ON "ProductVariant"("productId", "isActive");

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
