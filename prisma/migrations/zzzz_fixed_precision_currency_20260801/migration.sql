-- The paymentless release uses one authoritative base currency.
-- Existing floating-point values are rounded once during migration and all
-- subsequent calculations use integer cents before being stored as NUMERIC.

ALTER TABLE "Product"
  ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  ALTER COLUMN "price" TYPE DECIMAL(18,2) USING ROUND("price"::numeric, 2),
  ALTER COLUMN "originalPrice" TYPE DECIMAL(18,2) USING ROUND("originalPrice"::numeric, 2);

ALTER TABLE "ProductVariant"
  ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  ALTER COLUMN "price" TYPE DECIMAL(18,2) USING ROUND("price"::numeric, 2),
  ALTER COLUMN "originalPrice" TYPE DECIMAL(18,2) USING ROUND("originalPrice"::numeric, 2);

ALTER TABLE "Order"
  ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  ALTER COLUMN "subtotal" TYPE DECIMAL(18,2) USING ROUND("subtotal"::numeric, 2),
  ALTER COLUMN "shippingCost" TYPE DECIMAL(18,2) USING ROUND("shippingCost"::numeric, 2),
  ALTER COLUMN "discount" TYPE DECIMAL(18,2) USING ROUND("discount"::numeric, 2),
  ALTER COLUMN "tax" TYPE DECIMAL(18,2) USING ROUND("tax"::numeric, 2),
  ALTER COLUMN "total" TYPE DECIMAL(18,2) USING ROUND("total"::numeric, 2);

ALTER TABLE "OrderItem"
  ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  ALTER COLUMN "price" TYPE DECIMAL(18,2) USING ROUND("price"::numeric, 2),
  ALTER COLUMN "total" TYPE DECIMAL(18,2) USING ROUND("total"::numeric, 2);

ALTER TABLE "Coupon"
  ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  ALTER COLUMN "discount" TYPE DECIMAL(18,2) USING ROUND("discount"::numeric, 2),
  ALTER COLUMN "minOrder" TYPE DECIMAL(18,2) USING ROUND("minOrder"::numeric, 2),
  ALTER COLUMN "maxDiscount" TYPE DECIMAL(18,2) USING ROUND("maxDiscount"::numeric, 2);

ALTER TABLE "Return"
  ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  ALTER COLUMN "unitPrice" TYPE DECIMAL(18,2) USING ROUND("unitPrice"::numeric, 2),
  ALTER COLUMN "refundAmount" TYPE DECIMAL(18,2) USING ROUND("refundAmount"::numeric, 2);

ALTER TABLE "Invoice"
  ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  ALTER COLUMN "subtotal" TYPE DECIMAL(18,2) USING ROUND("subtotal"::numeric, 2),
  ALTER COLUMN "shipping" TYPE DECIMAL(18,2) USING ROUND("shipping"::numeric, 2),
  ALTER COLUMN "discount" TYPE DECIMAL(18,2) USING ROUND("discount"::numeric, 2),
  ALTER COLUMN "tax" TYPE DECIMAL(18,2) USING ROUND("tax"::numeric, 2),
  ALTER COLUMN "total" TYPE DECIMAL(18,2) USING ROUND("total"::numeric, 2);

ALTER TABLE "Product" ADD CONSTRAINT "Product_currency_base" CHECK ("currency" = 'USD');
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_currency_base" CHECK ("currency" = 'USD');
ALTER TABLE "Order" ADD CONSTRAINT "Order_currency_base" CHECK ("currency" = 'USD');
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_currency_base" CHECK ("currency" = 'USD');
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_currency_base" CHECK ("currency" = 'USD');
ALTER TABLE "Return" ADD CONSTRAINT "Return_currency_base" CHECK ("currency" = 'USD');
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_currency_base" CHECK ("currency" = 'USD');
