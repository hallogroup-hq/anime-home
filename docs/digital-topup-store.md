# Anime Home — Digital Top Up (VIPayment + TriPay)

## Scope and production boundaries

- Entirely separate from legacy merchandise checkout and GoPay/QRIS code. No GoPay change, key rotation or Railway deployment is part of this feature.
- VIPayment Game Feature API supplies live products, SKU, cost and fulfillment; TriPay collects customer QRIS payments.
- Product prices are based on **real VIPayment API data**, never sample prices. Missing credentials or missing products = unavailable, not a fake checkout.
- Store routes: `/topup`, `/topup/[slug]`, `/topup/order/[id]`.
- Store is disabled by default: `TOPUP_STORE_ENABLED` must be the literal string `true` to show synced prices or allow checkout.
- Order status and product records live in isolated `topup_*` tables in the existing Turso instance. No existing anime/merch tables are touched.
- Safe migration: schema is created idempotently only when a permitted enabled catalog call or authenticated admin action occurs. Ensure previews do **not** share a production database when enabling the store.

## Secrets (server side only, never NEXT_PUBLIC_* or GitHub)

| Name | Purpose |
|---|---|
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Database connection, already used by Anime Home |
| `VIPAY_API_ID`, `VIPAY_API_KEY` | VIPayment reseller account API access |
| `TRIPAY_API_KEY`, `TRIPAY_PRIVATE_KEY`, `TRIPAY_MERCHANT_CODE` | New TriPay merchant account, **different from merchandise GoPay** |
| `TRIPAY_MODE` | `sandbox` (default) or `production` |
| `TOPUP_PUBLIC_ORIGIN` | Exact public HTTPS origin, e.g. the protected preview test URL or your verified production domain (no trailing slash) |
| `TOPUP_ADMIN_SYNC_KEY` | 32+ random secret for product catalog sync |
| `TOPUP_STORE_ENABLED` | `false` until real credentials and tests pass |
| `TOPUP_ALLOWED_GAMES` | Optional comma-delimited list of approved game slugs |
| `TOPUP_MARKUP_PERCENT`, `TOPUP_MARKUP_FIXED` | Base price markup for supplier cost; defaults to 8% + Rp1.200, rounded up to Rp100 |

Vercel Preview and Production must use separate test/live API keys and preferably separate database instances. In sandbox, simulated `PAID` status is written as `SANDBOX_PAID` **without calling VIPayment**.

## Catalog operations

1. Obtain and activate VIPayment API access through the official VIP reseller website, and confirm actual pricing tier and products.
2. Create a TriPay merchant and enable QRIS for the legal business selling the products. Confirm payment processing fees and compliance requirements.
3. Set server env vars on protected preview first; explicitly keep `TRIPAY_MODE=sandbox`.
4. Set `TOPUP_PUBLIC_ORIGIN` to the exact preview origin so TriPay callbacks can reach `/api/topup/callback/tripay`.
5. Set a long `TOPUP_ADMIN_SYNC_KEY`. Trigger an authenticated POST to `/api/topup/admin/sync` using `Authorization: Bearer <ADMIN_KEY>` in your secured operator session.
6. Check products and prices against the authenticated VIPayment account (supplier costs are not visible to customers).
7. Use the TriPay sandbox simulator to pay a test order. Confirm it reaches `SANDBOX_PAID` and makes **zero** VIPayment orders.
8. Verify invalid or duplicate callbacks, mismatched amounts, multiple requests, rate limits, and disabled stock.
9. Audit payment fees and source-of-funds timing, VIPayment balance, refund policy, privacy/legal disclosures, merchant approval, support and operational monitoring.
10. Only after all checks pass, configure a separate production TriPay merchant and switch `TRIPAY_MODE=production`, with a verified origin and small controlled real-money transaction.

## Security and reconciliation

- The checkout never accepts price from browsers; only server-cached approved VIPayment SKUs are sold.
- TriPay create uses HMAC-SHA256; callbacks verify the signature on the **raw request body** plus event, order, reference and paid amount.
- VIPayment callbacks authenticate their `X-Client-Signature` using MD5(API ID + API KEY) per official documentation.
- Receipt lookup requires a random, unguessable 256-bit secret stored in browser storage and hashed in the DB. The order URL itself does not grant access.
- Vendor order is only attempted on an atomically claimed, confirmed-paid record. Ambiguous supplier timeouts go to `MANUAL_REVIEW`, never blind auto-retry.
- Supplier price and availability are checked again before placing a paid order, protecting against supplier price jumps.
- A receipt page read with a valid receipt secret triggers a rate-limited, signed-provider reconciliation every minute if needed.
- For abandoned orders, operational reconciliation and alerting still need a trusted scheduled process before high-volume rollout.
- Refunds and failed fulfillment currently require **manual review**; do not promise automated refunds.
- Treat vouchers/PIN details as private customer data. Never print the receipt secret or provider credentials into logs.
- Do not sell credential-requiring services or Joki/account-access products through this flow.

## Release gate

- [ ] Full TypeScript build succeeds.
- [ ] `npm run test:topup` and existing `npm test` pass.
- [ ] Verify mobile UI and status refresh on preview.
- [ ] Test real TriPay sandbox callback (genuine simulator, not forged paid status).
- [ ] Confirm duplicate webhook idempotency, mismatched amount rejection, VIP supplier request once.
- [ ] VIPayment service listing, actual prices, and account balance confirmed.
- [ ] Payment and supplier callbacks reachable over HTTPS, credentials stored only in server environments.
- [ ] Provide merchant support, escalation for `MANUAL_REVIEW`, reversal/refund process and terms.
- [ ] Obtain go-live authorization for production. Do not merge while any item fails.

References: https://vip-reseller.co.id/page/api/game-feature and https://tripay.co.id/developer

## BLOCKED — VIPayment IP allowlist (15 October 2026)

- A real VIPayment account is configured as **sensitive Vercel Preview branch-only** environment variables, with no secrets committed to Git.
- Read-only GET diagnostic against `/api/profile` returned a supplier rejection classified as **IP_RESTRICTION**; this was **not** a successfully authenticated profile response.
- Separate Vercel function requests showed outgoing IPs changing from `75.101.211.240` to `34.205.45.166`, despite the user whitelisting the former.
- Do **not** repeatedly add transient Vercel outbound IPs to the supplier allowlist or ship customer checkout on this setup.
- Vercel Static IP is a costly add-on; Railway Hobby does not offer static egress (Railway Pro is required).
- Low-budget candidate: Fly.io small Machine with a static egress IPv4 (currently ~$2.19/month for 256 MB compute plus ~$3.60/month for static egress IPv4, before transfer and regional differences). **Not purchased or deployed**; user must approve billing and provisioning.
- Preferred future architecture: keep customer-facing Next.js on Vercel, relay *only* authenticated supplier requests via a separate fixed-egress service. All supplier and inter-service secrets stay in server environment settings; enforce signing, HTTPS, replay defense, route and method allowlisting, and no unrestricted public proxy.
- The temporary unauthenticated diagnostics route used solely to identify the issue was removed from the branch after testing. Older immutable Vercel preview snapshots may still exist and should not be used for real testing or payment.
- `TOPUP_STORE_ENABLED=false` on branch Preview; checkout remains closed. No customer payment or VIPayment order has been attempted.
- Next gates: approve an affordable fixed-egress provider; provision stable IP; register that IP at VIPayment; verify read-only profile, service listing, SKU status and prices; run sandbox TriPay tests; test end-to-end idempotent fulfillment. Do not merge until pass.

## VIPayment connectivity proof — 15 October 2026 (after IP whitelist update)

- Customer configured the preview function's observed egress IPv4 `52.3.231.94` in VIPayment IP allowlist, keeping API account on **Development**.
- **4 of 4** consecutive read-only supplier API tests returned successfully authenticated profile and successfully parsed supplier catalog on the preview deployment with that outbound IP.
- Per response, the current curated game matching logic processed **5,245** product rows and marked **819** as available. These are unreviewed catalog matches, **not** an approved list of sellable items, nor a guarantee that every SKU is correctly classified. Confirm category/region/product type and actual supplier costs before opening checkout.
- Test did **not** submit orders, change VIPayment balance, write catalog to the user database, activate TriPay or enable checkout.
- The short-lived preview smoke-test endpoint was removed from the feature branch immediately after the successful tests. Immutable old preview deployment links may retain that diagnostic until expired; avoid public sharing and restrict/remove old deployments if necessary.
- The IP is **not stable/guaranteed** for ongoing production. Before enabling purchases, implement a stable outbound-IP solution and confirm the supplier's rules for allowlisting the new IP. Never automatically retry unconfirmed fulfillment or accept payments without verified settlement.
- Keep `TOPUP_STORE_ENABLED=false`, `TRIPAY_MODE=sandbox`, and this pull request as draft until full payment/fulfillment QA is successful.
