import type { AccountDeletionDto } from '@haramain/shared';
import type { FastifyInstance } from 'fastify';

import { requireCustomer } from '../auth/customerAuth.js';
import type { AppDeps } from '../deps.js';
import { Sentry } from '../lib/sentry.js';
import { deleteCustomerData } from '../services/accountDeletion.js';

export function accountRoutes(app: FastifyInstance, deps: AppDeps): void {
  // In-app account deletion (App Store guideline 5.1.1(v)). Few legitimate callers, so the limit is tight.
  app.delete(
    '/account',
    { preHandler: requireCustomer(deps.verifyCustomer), config: { rateLimit: { max: 3, timeWindow: '1 hour' } } },
    async (request): Promise<AccountDeletionDto> => {
      const customerId = request.customerId;
      await deleteCustomerData(deps.prisma, customerId);

      try {
        await deps.requestCustomerErasure(customerId);
        return { status: 'requested' };
      } catch (error) {
        // Our own data is already gone; Shopify's copy needs the operator (missing scope, or an outage).
        request.log.error(error, 'Shopify erasure request failed');
        Sentry.captureException(error, { extra: { customerId, action: 'customer-erasure' } });
        return { status: 'manual_review' };
      }
    },
  );
}
