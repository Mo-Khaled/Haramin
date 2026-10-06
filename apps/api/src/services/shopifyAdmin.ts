import { env, SHOPIFY_API_VERSION } from '../lib/env.js';
import { customerGid, orderGid } from '../lib/hmac.js';
import { getAdminToken } from './shopifyToken.js';

interface GraphQLResult<T> {
  data?: T;
  errors?: { message: string }[];
}

export async function adminGraphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await getAdminToken() },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`Shopify Admin HTTP ${response.status}`);
  const json = (await response.json()) as GraphQLResult<T>;
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
  if (!json.data) throw new Error('Empty Shopify Admin response');
  return json.data;
}

interface UserErrors {
  userErrors: { message: string }[];
}

function assertNoUserErrors(result: UserErrors, action: string): void {
  if (result.userErrors.length) {
    throw new Error(`${action} failed: ${result.userErrors.map((e) => e.message).join('; ')}`);
  }
}

/** Credits the customer's Shopify store credit balance, which applies automatically at checkout. */
export async function creditStoreCredit(customerId: string, amountEgp: number): Promise<void> {
  const data = await adminGraphql<{ storeCreditAccountCredit: UserErrors }>(
    `mutation Credit($id: ID!, $input: StoreCreditAccountCreditInput!) {
      storeCreditAccountCredit(id: $id, creditInput: $input) { userErrors { message } }
    }`,
    {
      id: customerGid(customerId),
      input: { creditAmount: { amount: amountEgp.toFixed(2), currencyCode: 'EGP' } },
    },
  );
  assertNoUserErrors(data.storeCreditAccountCredit, 'Store credit');
}

/** Takes store credit back from the customer's balance; Shopify rejects it when the balance is too low. */
export async function debitStoreCredit(customerId: string, amountEgp: number): Promise<void> {
  const data = await adminGraphql<{ storeCreditAccountDebit: UserErrors }>(
    `mutation Debit($id: ID!, $input: StoreCreditAccountDebitInput!) {
      storeCreditAccountDebit(id: $id, debitInput: $input) { userErrors { message } }
    }`,
    {
      id: customerGid(customerId),
      input: { debitAmount: { amount: amountEgp.toFixed(2), currencyCode: 'EGP' } },
    },
  );
  assertNoUserErrors(data.storeCreditAccountDebit, 'Store credit debit');
}

/** Asks Shopify to erase the customer's personal data (it honours its own legal retention rules for orders). */
export async function requestCustomerErasure(customerId: string): Promise<void> {
  const data = await adminGraphql<{ customerRequestDataErasure: UserErrors }>(
    `mutation Erase($id: ID!) { customerRequestDataErasure(customerId: $id) { userErrors { message } } }`,
    { id: customerGid(customerId) },
  );
  assertNoUserErrors(data.customerRequestDataErasure, 'Customer erasure request');
}

export async function addOrderTags(orderId: string | number, tags: string[]): Promise<void> {
  const data = await adminGraphql<{ tagsAdd: UserErrors }>(
    `mutation Tag($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }`,
    { id: orderGid(orderId), tags },
  );
  assertNoUserErrors(data.tagsAdd, 'Order tagging');
}
