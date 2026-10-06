-- CreateTable
CREATE TABLE "CancelledOrder" (
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancelledOrder_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "PendingReversal" (
    "orderId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingReversal_pkey" PRIMARY KEY ("orderId","key")
);

-- CreateIndex
CREATE INDEX "ProcessedWebhook_processedAt_idx" ON "ProcessedWebhook"("processedAt");

-- CreateIndex
CREATE INDEX "AbandonedCheckout_createdAt_idx" ON "AbandonedCheckout"("createdAt");
