import type { PrismaClient } from '@prisma/client';

/**
 * Removes everything this backend holds about a customer. Shipments are order records the business must
 * keep, so they are detached from the customer instead of deleted.
 */
export async function deleteCustomerData(prisma: PrismaClient, customerId: string): Promise<void> {
  const owner = { shopifyCustomerId: customerId };
  await prisma.$transaction([
    prisma.wishlistItem.deleteMany({ where: owner }),
    prisma.deviceToken.deleteMany({ where: owner }),
    prisma.pointsLedger.deleteMany({ where: owner }),
    prisma.abandonedCheckout.deleteMany({ where: owner }),
    prisma.shipmentMap.updateMany({ where: owner, data: { shopifyCustomerId: null } }),
  ]);
}
