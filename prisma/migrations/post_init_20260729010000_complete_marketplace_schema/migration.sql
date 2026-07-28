-- Complete the PostgreSQL schema after the original baseline migration.
-- IF NOT EXISTS guards make this safe for environments that were previously
-- synchronized with `prisma db push` before migration history was repaired.

ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "nameAr" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "descriptionAr" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "Car" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "mileage" INTEGER,
    "fuelType" TEXT NOT NULL DEFAULT 'gasoline',
    "transmission" TEXT NOT NULL DEFAULT 'automatic',
    "bodyType" TEXT NOT NULL DEFAULT 'sedan',
    "condition" TEXT NOT NULL DEFAULT 'used',
    "color" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "city" TEXT,
    "country" TEXT,
    "sellerId" TEXT NOT NULL,
    "storeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Property" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "listingType" TEXT NOT NULL DEFAULT 'sale',
    "propertyType" TEXT NOT NULL DEFAULT 'apartment',
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "area" DOUBLE PRECISION,
    "isFurnished" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT,
    "country" TEXT,
    "address" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "agentName" TEXT,
    "agentPhone" TEXT,
    "isVerifiedAgent" BOOLEAN NOT NULL DEFAULT false,
    "sellerId" TEXT NOT NULL,
    "storeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Classified" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "categoryId" TEXT NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'used',
    "city" TEXT,
    "country" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "contactPhone" TEXT,
    "sellerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Classified_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "company" TEXT NOT NULL,
    "companyLogo" TEXT,
    "location" TEXT,
    "city" TEXT,
    "country" TEXT,
    "type" TEXT NOT NULL DEFAULT 'full-time',
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "experienceLevel" TEXT NOT NULL DEFAULT 'entry',
    "skills" TEXT NOT NULL DEFAULT '[]',
    "category" TEXT,
    "applyUrl" TEXT,
    "contactEmail" TEXT,
    "posterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Service" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "priceUnit" TEXT NOT NULL DEFAULT 'hour',
    "category" TEXT,
    "providerName" TEXT,
    "providerAvatar" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "city" TEXT,
    "country" TEXT,
    "isAvailableToday" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "providerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Return" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "refundAmount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'other',
    "details" TEXT,
    "resolution" TEXT NOT NULL DEFAULT 'refund',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sellerNote" TEXT,
    "evidencePhotos" TEXT NOT NULL DEFAULT '[]',
    "timeline" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "targetPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isNotified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "shipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "taxId" TEXT,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payout" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Dispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "aiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Staff" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "inviteEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "image" TEXT,
    "link" TEXT,
    "ctaText" TEXT,
    "ctaTextAr" TEXT,
    "ctaLink" TEXT,
    "gradient" TEXT,
    "icon" TEXT,
    "position" TEXT NOT NULL DEFAULT 'hero',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HelpTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HelpTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Add relation constraints only when they are absent. This also makes the
-- migration compatible with databases previously managed through db push.
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Auction_productId_fkey' AND conrelid = '"Auction"'::regclass) THEN
        ALTER TABLE "Auction" ADD CONSTRAINT "Auction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Car_sellerId_fkey' AND conrelid = '"Car"'::regclass) THEN
        ALTER TABLE "Car" ADD CONSTRAINT "Car_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Car_storeId_fkey' AND conrelid = '"Car"'::regclass) THEN
        ALTER TABLE "Car" ADD CONSTRAINT "Car_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_sellerId_fkey' AND conrelid = '"Property"'::regclass) THEN
        ALTER TABLE "Property" ADD CONSTRAINT "Property_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Property_storeId_fkey' AND conrelid = '"Property"'::regclass) THEN
        ALTER TABLE "Property" ADD CONSTRAINT "Property_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Classified_categoryId_fkey' AND conrelid = '"Classified"'::regclass) THEN
        ALTER TABLE "Classified" ADD CONSTRAINT "Classified_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Classified_sellerId_fkey' AND conrelid = '"Classified"'::regclass) THEN
        ALTER TABLE "Classified" ADD CONSTRAINT "Classified_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Job_posterId_fkey' AND conrelid = '"Job"'::regclass) THEN
        ALTER TABLE "Job" ADD CONSTRAINT "Job_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Service_providerId_fkey' AND conrelid = '"Service"'::regclass) THEN
        ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Return_orderId_fkey' AND conrelid = '"Return"'::regclass) THEN
        ALTER TABLE "Return" ADD CONSTRAINT "Return_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Return_productId_fkey' AND conrelid = '"Return"'::regclass) THEN
        ALTER TABLE "Return" ADD CONSTRAINT "Return_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Return_buyerId_fkey' AND conrelid = '"Return"'::regclass) THEN
        ALTER TABLE "Return" ADD CONSTRAINT "Return_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Return_sellerId_fkey' AND conrelid = '"Return"'::regclass) THEN
        ALTER TABLE "Return" ADD CONSTRAINT "Return_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PriceAlert_userId_fkey' AND conrelid = '"PriceAlert"'::regclass) THEN
        ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PriceAlert_productId_fkey' AND conrelid = '"PriceAlert"'::regclass) THEN
        ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_orderId_fkey' AND conrelid = '"Invoice"'::regclass) THEN
        ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_sellerId_fkey' AND conrelid = '"Invoice"'::regclass) THEN
        ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_buyerId_fkey' AND conrelid = '"Invoice"'::regclass) THEN
        ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payout_sellerId_fkey' AND conrelid = '"Payout"'::regclass) THEN
        ALTER TABLE "Payout" ADD CONSTRAINT "Payout_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payout_storeId_fkey' AND conrelid = '"Payout"'::regclass) THEN
        ALTER TABLE "Payout" ADD CONSTRAINT "Payout_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Dispute_orderId_fkey' AND conrelid = '"Dispute"'::regclass) THEN
        ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Dispute_buyerId_fkey' AND conrelid = '"Dispute"'::regclass) THEN
        ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Dispute_sellerId_fkey' AND conrelid = '"Dispute"'::regclass) THEN
        ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Staff_storeId_fkey' AND conrelid = '"Staff"'::regclass) THEN
        ALTER TABLE "Staff" ADD CONSTRAINT "Staff_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Staff_userId_fkey' AND conrelid = '"Staff"'::regclass) THEN
        ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'HelpTicket_userId_fkey' AND conrelid = '"HelpTicket"'::regclass) THEN
        ALTER TABLE "HelpTicket" ADD CONSTRAINT "HelpTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_adminId_fkey' AND conrelid = '"AuditLog"'::regclass) THEN
        ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
