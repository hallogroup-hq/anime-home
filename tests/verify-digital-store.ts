import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

const data = read('src/lib/topup/data.ts');
const engine = read('src/lib/topup/engine.ts');
const providers = read('src/lib/topup/providers.ts');
const paymentCallback = read('src/app/api/topup/callback/tripay/route.ts');
const supplierCallback = read('src/app/api/topup/callback/vip/route.ts');
const checkout = read('src/app/api/topup/checkout/route.ts');
const receipt = read('src/app/api/topup/orders/[id]/route.ts');

assert.match(data, /CREATE TABLE IF NOT EXISTS topup_products/);
assert.match(data, /CREATE TABLE IF NOT EXISTS topup_orders/);
assert.match(data, /TOPUP_STORE_ENABLED !== 'true'/);
assert.match(data, /token_hash TEXT NOT NULL/);
assert.match(engine, /state = 'PAYMENT_CONFIRMED'/);
assert.match(engine, /WHERE id = \? AND state = 'PAYMENT_CONFIRMED'/);
assert.match(engine, /SANDBOX_PAID/);
assert.match(engine, /SUPPLIER_PRICE_CHANGED/);
assert.match(engine, /!\/^\[0-9a-f\]\{64\}\$\/\.test\(token\)/);
assert.match(providers, /createHmac\('sha256'/);
assert.match(providers, /createHash\('md5'/);
assert.match(providers, /api-sandbox/);
assert.match(providers, /vip-reseller\.co\.id\/api\/game-feature/);
assert.match(paymentCallback, /validTripayCallback\(raw,/);
assert.match(supplierCallback, /safeEqualHex\(signature, vipWebhookSignature\(\)\)/);
assert.match(checkout, /schema\.safeParse/);
assert.match(receipt, /publicOrderStatus/);
assert.match(receipt, /pollTopupOrder/);

for (const source of [data, engine, providers, checkout, receipt]) {
  assert.doesNotMatch(source, /GOPAY_GATEWAY_API_KEY|requestDynamicQRIS|verifyQRISStatus/);
}
console.log('PASS: Digital store isolation, callback signatures, sandbox guard and idempotency source contracts.');
