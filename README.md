# Haramain Perfumes

Mobile app for haramaineg.com (Shopify, EGP, English/Arabic).

| Path | What it is |
|---|---|
| `apps/mobile` | Expo / React Native app. Catalog, cart and checkout run straight against Shopify's Storefront API. |
| `apps/api` | Fastify + Prisma service on Railway: wishlist, loyalty points, push, Shopify and Bosta webhooks. |
| `packages/shared` | Types and loyalty constants shared by both. |

## How the pieces fit

- **Shopify is the system of record** for products, customers, orders, carts and discounts. The app reads them through the Storefront API (no token needed for reads and carts; a token only raises rate limits) and signs customers in through the Customer Account API (OAuth + PKCE, email-code login hosted by Shopify).
- **Checkout is Shopify's hosted checkout** in a WebView. It handles Cash on Delivery, InstaPay and card exactly as the website does. The app detects the thank-you URL, clears the cart and shows its own confirmation.
- **Railway Postgres** holds only what Shopify can't: wishlist, loyalty ledger, device tokens, shipment mapping, processed webhook ids.
- **Loyalty**: 1 point per 10 EGP of order subtotal, awarded on `orders/paid`. 100 points redeem for 50 EGP of Shopify store credit (applies automatically at checkout). The ledger is append-only; a failed credit refunds the points.
- **Webhooks** are HMAC-verified, de-duplicated by event id, queued (BullMQ on Redis) and processed by a separate worker with retries.

## Local development

```bash
pnpm install
pnpm --filter @haramain/shared build      # API runtime imports the built shared package
cp apps/mobile/.env.example apps/mobile/.env
cp apps/api/.env.example apps/api/.env
pnpm mobile                               # Expo dev server (use a dev build, not Expo Go: native tabs, secure store)
pnpm api                                  # API on :3000 (needs DATABASE_URL and REDIS_URL)
```

Checks: `cd apps/api && pnpm test`, `cd apps/mobile && node ../../node_modules/typescript/bin/tsc --noEmit`.

## Railway

Two services from this repo, both using the root `railway.json` (Dockerfile `apps/api/Dockerfile`), each with:

```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
REDIS_URL    = ${{Redis.REDIS_URL}}
```

- **api**: default start command (runs `prisma migrate deploy`, then the server). Generate a public domain.
- **worker**: same repo, start command `node dist/worker.js`, no public domain.

Additional variables for both: `SHOPIFY_SHOP_DOMAIN`, `SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`, `BOSTA_API_KEY`, `BOSTA_WEBHOOK_SECRET`, `PUBLIC_API_URL` (the api service's public URL), `SENTRY_DSN` (optional).

## Shopify setup (Admin)

1. **Custom app** (Settings, Apps and sales channels, Develop apps). Admin API scopes: `read_orders`, `write_orders`, `read_customers`, `read_products`, `write_store_credit_account_transactions`. Copy the Admin token to `SHOPIFY_ADMIN_TOKEN`; copy the app's API secret to `SHOPIFY_WEBHOOK_SECRET`.
2. **Webhooks** (JSON, pointing at `https://<api-domain>/webhooks/shopify`): `orders/create`, `orders/paid`, `products/update`, `checkouts/create`, `checkouts/update`.
3. **Customer Account API**: install the Headless channel, enable Customer Account API, and add the callback URI printed by the app (`haramain://auth/callback`, plus the Expo dev-client URI while testing) and the JavaScript origin if asked. Put the client id in `EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID`.
4. **Store credit** must be enabled for EGP (Settings, Customer accounts).
5. Payment gateway names must contain "Cash on Delivery", "InstaPay" or a card gateway name so orders are tagged `payment-cod` / `payment-instapay` / `payment-card`.

## Bosta

Create a Business account and put the API key in `BOSTA_API_KEY`. Shipments are created on `orders/create` for COD (with the outstanding amount as COD) and on `orders/paid` for prepaid orders. The status webhook is `POST /webhooks/bosta?secret=...`.

## Known gaps and things to confirm

- **Apple sign-in**: not implemented. Shopify's hosted Customer Account login cannot be bridged from a custom Apple token, and Apple isn't available on the Basic plan. Apple's guideline 4.8 only applies if the login page you present offers third-party social sign-in; email-code login is generally accepted as the privacy-preserving alternative. Verify this against the live login page before submitting to the App Store.
- **Bosta payload** (city naming, zone ids, the numeric state codes in `domain/bosta.ts`) was written from Bosta's public docs and needs one real test shipment to confirm.
- **Customer Account API orders query** needs one run with a real login to confirm field availability.
- **InstaPay**: v1 shows the WhatsApp deep link on the confirmation screen. In-app screenshot upload is a later option (the `PaymentProof` table is ready).
- **Reviews**: the review app on the store isn't identified yet, so no reviews UI.
- **Branding assets**: icon, splash and adaptive icon are still the Expo template; replace them in `apps/mobile/assets`.
