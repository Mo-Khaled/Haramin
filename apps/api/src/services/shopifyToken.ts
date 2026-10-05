import { env } from '../lib/env.js';

const REFRESH_MARGIN_MS = 5 * 60_000;

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;

async function requestClientCredentialsToken(): Promise<CachedToken> {
  const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  if (!response.ok) throw new Error(`Shopify token exchange failed: HTTP ${response.status}`);
  const json = (await response.json()) as { access_token: string; expires_in?: number };
  return { value: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 86_399) * 1000 };
}

/** Returns an Admin API token: the static one if configured, else a cached client-credentials token. */
export async function getAdminToken(): Promise<string> {
  if (env.SHOPIFY_ADMIN_TOKEN) return env.SHOPIFY_ADMIN_TOKEN;
  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) {
    throw new Error('Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET (or SHOPIFY_ADMIN_TOKEN)');
  }
  if (!cached || cached.expiresAt - Date.now() < REFRESH_MARGIN_MS) cached = await requestClientCredentialsToken();
  return cached.value;
}
