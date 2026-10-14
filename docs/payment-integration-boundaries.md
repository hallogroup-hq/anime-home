# Payment integration boundaries — Anime Home

## Current production flow: merchandise

- Routes and order processing for merchandise continue using the existing GoPay/QRIS service.
- Server-only configuration: `GOPAY_GATEWAY_URL` and `GOPAY_GATEWAY_API_KEY`.
- Never commit API keys or provide hardcoded fallback secrets.
- The existing local QR generator is retained for backwards compatibility **only**. A QR code is **not** payment confirmation. Do not dispatch products based on QR generation or an uploaded screenshot.
- A production-grade automated checkout must verify a specific payment against a provider-confirmed merchant transaction and exact order/amount before marking an order paid.

## Planned isolated flow: game top-ups and vouchers

- Dedicated route namespace `/topup`; dedicated tables/records, payment state machine, webhook verification, and supplier fulfillment.
- VIPayment / VIP-Reseller Game Feature API is a **reseller fulfillment API funded by reseller balance**, not a confirmed customer-facing payment gateway. Do not conflate its order or balance endpoints with payment collection.
- Customer payment for game purchases must use its own verified payment provider/account/credentials and callback endpoints. Do not reuse the existing merchandise payment credentials or statuses.
- Fulfillment must require confirmed, idempotent, amount-matched payment; enforce sufficient supplier balance, validated product and destination, retry-safe order IDs, callback authenticity and audit logs.
- Keep catalog extensible for multiple suppliers but only enable products and payment methods actually supported and tested.

## Required GoPay gateway secret remediation

1. Treat the GoPay gateway key formerly embedded in `src/lib/services/paymentGateway.ts` and its Git history as compromised.
2. Rotate/revoke that credential at the actual upstream GoPay gateway deployment (currently Railway), and update its authorized clients accordingly.
3. Store the **new** key in the Vercel project as a sensitive `GOPAY_GATEWAY_API_KEY` environment variable for the required environments. Also configure `GOPAY_GATEWAY_URL` as needed.
4. Redeploy affected clients only after the upstream credential and env configuration agree. Confirm the old key no longer authenticates.
5. Verify actual incoming payment confirmations end to end. Do not equate a passing QR generation test with a verified payment.

No key values belong in this document or in Git.
