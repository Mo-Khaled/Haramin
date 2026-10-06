import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { env } from './env';

WebBrowser.maybeCompleteAuthSession();

const API_VERSION = '2025-07';
const SESSION_KEY = 'haramain.session';
const ISSUER = `https://shopify.com/authentication/${env.shopId}`;
const GRAPHQL_URL = `https://shopify.com/${env.shopId}/account/customer/api/${API_VERSION}/graphql`;

export interface Session {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  expiresAt: number;
}

export interface CustomerProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export interface OrderSummary {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  total: { amount: string; currencyCode: string };
  itemCount: number;
  trackingUrl: string | null;
}

export const isSignInConfigured = env.customerClientId.length > 0 && env.apiUrl.length > 0;

/**
 * Shopify only accepts HTTPS callback URLs, so it redirects to our API's bridge, which forwards the
 * result unchanged to the app's own scheme. The browser session closes when it sees APP_RETURN_URL.
 */
const redirectUri = `${env.apiUrl}/auth/callback`;
const APP_RETURN_URL = 'haramain://auth/callback';

export class SignInError extends Error {}

function toSession(token: AuthSession.TokenResponse): Session {
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken ?? null,
    idToken: token.idToken ?? null,
    expiresAt: Date.now() + (token.expiresIn ?? 3600) * 1000,
  };
}

async function save(session: Session | null): Promise<void> {
  if (session) await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  else await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function loadSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  const session = JSON.parse(raw) as Session;
  if (session.expiresAt - Date.now() > 60_000) return session;
  return refreshSession(session);
}

async function refreshSession(session: Session): Promise<Session | null> {
  if (!session.refreshToken) {
    await save(null);
    return null;
  }
  try {
    const discovery = await AuthSession.fetchDiscoveryAsync(ISSUER);
    const token = await AuthSession.refreshAsync(
      { clientId: env.customerClientId, refreshToken: session.refreshToken },
      discovery,
    );
    const next = { ...toSession(token), refreshToken: token.refreshToken ?? session.refreshToken };
    await save(next);
    return next;
  } catch {
    await save(null);
    return null;
  }
}

export async function signIn(): Promise<Session | null> {
  const discovery = await AuthSession.fetchDiscoveryAsync(ISSUER);
  const request = new AuthSession.AuthRequest({
    clientId: env.customerClientId,
    redirectUri,
    scopes: ['openid', 'email', 'customer-account-api:full'],
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
  });
  const authUrl = await request.makeAuthUrlAsync(discovery);
  const result = await WebBrowser.openAuthSessionAsync(authUrl, APP_RETURN_URL);
  if (result.type !== 'success') return null;

  const params = Linking.parse(result.url).queryParams ?? {};
  if (params.error) throw new SignInError(String(params.error_description ?? params.error));
  if (params.state !== request.state || typeof params.code !== 'string') {
    throw new SignInError('Sign-in response did not match the request');
  }
  const token = await AuthSession.exchangeCodeAsync(
    {
      clientId: env.customerClientId,
      code: params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    discovery,
  );
  const session = toSession(token);
  await save(session);
  return session;
}

export async function signOut(session: Session): Promise<void> {
  await save(null);
  try {
    const discovery = await AuthSession.fetchDiscoveryAsync(ISSUER);
    if (discovery.endSessionEndpoint && session.idToken) {
      const url = `${discovery.endSessionEndpoint}?id_token_hint=${encodeURIComponent(session.idToken)}&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;
      await WebBrowser.openAuthSessionAsync(url, APP_RETURN_URL);
    }
  } catch {
    // Local session is already cleared; remote logout is best-effort.
  }
}

async function customerQuery<T>(accessToken: string, query: string): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: accessToken },
    body: JSON.stringify({ query }),
  });
  const json = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (!response.ok || json.errors?.length || !json.data) {
    throw new Error(json.errors?.[0]?.message ?? `Customer API HTTP ${response.status}`);
  }
  return json.data;
}

export async function fetchProfile(accessToken: string): Promise<CustomerProfile> {
  const data = await customerQuery<{
    customer: { id: string; firstName: string | null; lastName: string | null; emailAddress: { emailAddress: string } | null };
  }>(accessToken, `{ customer { id firstName lastName emailAddress { emailAddress } } }`);
  const c = data.customer;
  return { id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.emailAddress?.emailAddress ?? null };
}

export async function fetchOrders(accessToken: string): Promise<OrderSummary[]> {
  const data = await customerQuery<{
    customer: {
      orders: {
        nodes: {
          id: string;
          name: string;
          processedAt: string;
          financialStatus: string | null;
          fulfillmentStatus: string | null;
          totalPrice: { amount: string; currencyCode: string };
          lineItems: { nodes: { quantity: number }[] };
          fulfillments: { nodes: { trackingInformation: { url: string | null }[] }[] };
        }[];
      };
    };
  }>(
    accessToken,
    `{ customer { orders(first: 30, reverse: true) { nodes {
        id name processedAt financialStatus fulfillmentStatus
        totalPrice { amount currencyCode }
        lineItems(first: 20) { nodes { quantity } }
        fulfillments(first: 5) { nodes { trackingInformation { url } } }
    } } } }`,
  );
  return data.customer.orders.nodes.map((o) => ({
    id: o.id,
    name: o.name,
    processedAt: o.processedAt,
    financialStatus: o.financialStatus,
    fulfillmentStatus: o.fulfillmentStatus,
    total: o.totalPrice,
    itemCount: o.lineItems.nodes.reduce((sum, l) => sum + l.quantity, 0),
    trackingUrl: o.fulfillments.nodes.flatMap((f) => f.trackingInformation).find((t) => t.url)?.url ?? null,
  }));
}
