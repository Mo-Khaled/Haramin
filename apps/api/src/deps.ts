import type { PrismaClient } from '@prisma/client';

import type { CustomerVerifier } from './auth/customerAuth.js';
import type { Enqueue } from './queues/index.js';
import type { ReviewsService } from './services/judgeme.js';

export interface AppDeps {
  prisma: PrismaClient;
  enqueue: Enqueue;
  verifyCustomer: CustomerVerifier;
  creditStoreCredit: (customerId: string, amountEgp: number) => Promise<void>;
  requestCustomerErasure: (customerId: string) => Promise<void>;
  reviews: ReviewsService;
}
