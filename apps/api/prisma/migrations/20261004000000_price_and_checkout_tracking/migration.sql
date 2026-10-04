-- AlterTable
ALTER TABLE "DeviceToken" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "ShipmentMap" ADD COLUMN     "orderName" TEXT,
ADD COLUMN     "shopifyCustomerId" TEXT;

-- CreateTable
CREATE TABLE "ProductPrice" (
    "productId" TEXT NOT NULL,
    "minPrice" DECIMAL(12,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "AbandonedCheckout" (
    "checkoutId" TEXT NOT NULL,
    "shopifyCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "AbandonedCheckout_pkey" PRIMARY KEY ("checkoutId")
);

-- CreateIndex
CREATE INDEX "AbandonedCheckout_notifiedAt_completedAt_createdAt_idx" ON "AbandonedCheckout"("notifiedAt", "completedAt", "createdAt");

