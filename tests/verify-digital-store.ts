import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash, createHmac } from 'node:crypto';
import { createVipSignature, createTripayCreateSignature, createTripayCallbackSignature, constantTimeHexMatch } from '../src/lib/topup/signatures';

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
assert.ok(engine.includes('!/^[0-9a-f]{64}$/.test(token)'), 'receipt requires a 64-character hex secret');
assert.match(providers, /createTripayCreateSignature/);
assert.match(providers, /createVipSignature/);
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

const sampleId = 'test-only-id';
const sampleKey = 'test-only-api-key-never-a-secret';
const expectedSign = createHash('md5').update(sampleId + sampleKey).digest('hex');
assert.equal(createVipSignature(sampleId, sampleKey), expectedSign);
assert.equal(expectedSign.length, 32);
assert.equal(constantTimeHexMatch(expectedSign.toUpperCase(), expectedSign), true);
assert.equal(constantTimeHexMatch('bad-signature', expectedSign), false);
assert.equal(constantTimeHexMatch(expectedSign.slice(0, -1), expectedSign), false);

const callbackBody = JSON.stringify({ merchant_ref: 'AHG-TEST', status: 'PAID', amount: 10000 });
const testPrivateKey = 'this-is-a-dummy-tripay-test-key';
const expectedCallback = createHmac('sha256', testPrivateKey).update(callbackBody).digest('hex');
assert.equal(createTripayCallbackSignature(callbackBody, testPrivateKey), expectedCallback);
assert.equal(constantTimeHexMatch(expectedCallback, createTripayCallbackSignature(callbackBody, testPrivateKey)), true);
assert.equal(constantTimeHexMatch(expectedCallback, createTripayCallbackSignature(callbackBody + ' ', testPrivateKey)), false);
const expectedCreate = createHmac('sha256', testPrivateKey).update('M-TEST' + 'AHG-TEST' + 10000).digest('hex');
assert.equal(createTripayCreateSignature('M-TEST', 'AHG-TEST', 10000, testPrivateKey), expectedCreate);
console.log('PASS: Signature computation, uppercase hex matching, and callback tamper detection.');
