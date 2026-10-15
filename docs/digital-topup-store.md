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

## Catalog preview-only snapshot (October 15, 2026)

- User authorized preview display of real VIPayment game SKU names, sell-side prices and status, **without enabling checkout**.
- An independent flag `TOPUP_CATALOG_PREVIEW_ENABLED=true` is scoped solely to the topup feature branch on Vercel Preview. It does not enable payment or fulfillment; `TOPUP_STORE_ENABLED=false` remains locked.
- `src/lib/topup/catalog.snapshot.json` stores **only public display fields** (sku, gameSlug, name, description, estimated retail price, capture timestamp), never supplier cost, API credentials or account details. Snapshot is source-derived and must never be populated with fabricated sample products.
- The read-only preview catalog shows search, sorting, pagination, SKU, retail reference price, and the snapshot timestamp. No checkout form or payment method appears.
- Snapshot capture is **not completed yet**: the Vercel outbound IP changed after the last allowed `52.3.231.94` IP. The current function returned `SUPPLIER_UNAVAILABLE` with the observed outbound IPv4 `44.192.48.127` on four consecutive tests. Whitelist it only temporarily for a one-time supplier catalog snapshot acquisition.
- The temporary branch-guarded GET export route `/api/topup/preview-catalog-export` excludes supplier cost and order functions; remove it promptly after the snapshot is captured. It must **not** be merged into main.
- The snapshot may become stale, so the customer-facing UI explicitly labels the timestamp and reference prices. Production payment will later use a stable IP and fresh supplier availability checks; never trust snapshot retail prices to fulfill orders.

## Turso catalog backup — versioned, preview-only (October 15, 2026)

- The previously proposed bundled JSON file was removed. This implementation uses new isolated Turso tables: `topup_catalog_snapshots`, `topup_catalog_items`, `topup_catalog_active`, and `topup_catalog_refresh`.
- A successful supplier read stores parsed game listings, SKU, name, description, cost, retail estimate, availability, source and capture time. Cost is **server-side only** and never returned to the browser.
- Import writes data into a fresh snapshot ID in batches and verifies row count **before** activating the new snapshot. If the supplier call or DB write fails, any previous active backup remains unchanged.
- Supplier refresh can occur automatically from preview catalog requests, at most once per minute on failure, and only if the last successful snapshot is older than 24 hours. Preview and store feature flags must be present; checkout remains strictly disabled.
- Retail UI reads data **from the active database backup** and never requires VIPayment for every visitor. It is a catalog-only reference, not a verified purchase-ready inventory.
- `GET /api/topup/catalog` reports `backupReady`, `capturedAt` and group counts. When the backup is empty, it also reports the IP egress observed at request time, **only in protected feature-branch preview** to help with VIPayment whitelist troubleshooting.
- As of initial implementation, database schema and cache logic compiled and passed code CI; an actual verified supplier import is **not claimed** until `backupReady=true` and SKU counts are observed in Turso. The supplier allowed IP may change after deploy.
- Before enabling production, confirm the isolation of Preview/Production Turso connections, configure fixed outbound IP, validate full supplier catalog taxonomy and required target formats, independently approve retail prices, then test payment and fulfillment.

## VERIFIED — first versioned Turso catalog backup (15 October 2026)

This supersedes the earlier **pending**, **empty snapshot**, and **IP-blocked** status notes above.

- Authenticated VIPayment profile and services calls from allowlisted Preview egress IP `52.90.34.251` succeeded.
- Raw parsed API listing: **5,245 rows**, of which **818** were flagged available in the source response. The supplier supplied **37 extra duplicated SKU occurrences**; all rows whose SKU was repeated were withheld from public listing and retained in a separate private `topup_catalog_duplicate_rows` quarantine table. No ambiguous SKU is sellable.
- Database active snapshot is **confirmed**: `backupReady=true`, `capturedAt=2026-10-15T09:11:07.088Z` (16:11 WIB), plus **9 game groups with 812 currently available unique SKUs** returned from Turso.
- Page checks: `/topup`, `/topup/mobile-legends`, `/topup/free-fire`, and `/topup/valorant` returned HTTP 200. The three game pages rendered real SKU retail prices in catalog-only mode, with **no purchase controls**. Empty Wuthering Waves state rendered correctly.
- Price display is a **reference** from this supplier snapshot and the configured margin formula; it has not been independently approved for sale. Supplier availability can change. Do not enable purchases without live status, margin, target validation and payment gates.
- Initial backup is durable in Turso and does not depend on fixed Vercel egress to serve storefront reads. Automatic refresh after 24 hours may fail on a new IP; failed refresh preserves the last good snapshot.
- Health-check and outbound-IP diagnostic routes used during troubleshooting were removed from the feature branch after verifying the backup. The public catalog endpoint no longer surfaces an outbound IP.
- Production is unchanged; feature PR stays a draft and `TOPUP_STORE_ENABLED=false`, with TriPay sandbox not configured. No supplier purchase or customer payment occurred.

## Complete supplier directory expansion — 15 October 2026

- Existing curated Turso catalog stays untouched as a durable backup/fallback; production and checkout flags remain unchanged.
- New preview-only flag: `TOPUP_FULL_CATALOG_PREVIEW_ENABLED=true`, scoped to feature-branch Preview; `TOPUP_STORE_ENABLED=false` remains mandatory.
- **Game Feature**: reads the **unfiltered** VIPayment `/api/game-feature type=services` catalog. Categories are derived from the supplier's `game` field, with stable URL slugs, while the original supplier grouping is retained per SKU. The versioned Turso archive retains every valid row index, including unavailable, manual-review, and duplicated SKUs. Ambiguous codes and manual/credential-dependent services are flagged and never enabled for checkout.
- **Prepaid**: reads the separate VIPayment `/api/prepaid type=services` catalog for mobile credit, data plans and prepaid vouchers. Archive is separately versioned in `topup_prepaid_versions`, `topup_prepaid_items`, `topup_prepaid_active` and `topup_prepaid_refresh`. Every parsed supplier row is stored including unavailable, duplicate, or incomplete SKUs.
- Pricing uses the same current estimated retail formula (**8% + Rp1,200, rounded up to Rp100**) and hides wholesale supplier cost from HTML/browser endpoints. Do not interpret estimated markup as net profit.
- The directory is **read-only** and labels reference prices and manual review/unavailable statuses. It includes filters for Game & Voucher vs Pulsa & Data. Only source-validated successful snapshots become active. Failed imports keep previously good backups intact.
- Initial first-time Game Feature and Prepaid imports are deliberately staged across consecutive requests to avoid simultaneously triggering two potentially expensive wholesale API syncs.
- `GET /api/topup/full-catalog` returns sanitized per-source snapshot status/count/timestamp for QA only, unavailable outside the branch's Preview flag. It never exposes supplier costs, balances or secrets.
- **Data proof pending** until both sources report `ready=true` with independently checked counts and representative HTML pages render. Dynamic Vercel IP allowlisting may need a further temporary update before these new source imports can run.
- Prepaid and Game Feature are **not** every VIPayment product family. Postpaid bills, social-media services, and other non-fixed-amount or specialized APIs are excluded from this top-up/voucher scope and need separate workflows if explicitly commissioned.
