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

const catalogPreview = read('src/components/topup/CatalogPreview.tsx');
const gamePage = read('src/app/topup/[slug]/page.tsx');
const backup = read('src/lib/topup/catalog-store.ts');
assert.match(backup, /CREATE TABLE IF NOT EXISTS topup_catalog_snapshots/);
assert.match(backup, /CREATE TABLE IF NOT EXISTS topup_catalog_items/);
assert.match(backup, /CREATE TABLE IF NOT EXISTS topup_catalog_active/);
assert.match(backup, /SUPPLIER_SNAPSHOT_COUNT_MISMATCH/);
assert.match(backup, /CREATE TABLE IF NOT EXISTS topup_catalog_duplicate_rows/);
assert.match(backup, /frequencies.get\(p.sku\)===1/);
assert.match(backup, /quarantined.length/);
assert.match(backup, /sellable.length\+quarantined.length!==products.length/);

assert.match(backup, /await db.batch\(statements.slice/);
assert.match(backup, /supplier_cost INTEGER NOT NULL/);
assert.match(backup, /TOPUP_CATALOG_PREVIEW_ENABLED !== 'true'/);
assert.doesNotMatch(backup, /GOPAY_GATEWAY_API_KEY|TRIPAY_PRIVATE_KEY|vipCreateOrder/);
assert.match(data, /TOPUP_CATALOG_PREVIEW_ENABLED/);
assert.match(data, /TOPUP_STORE_ENABLED !== 'true'/);
assert.match(data, /VERCEL_ENV === 'preview'/);
assert.match(gamePage, /previewOnly \? <CatalogPreview/);
assert.match(catalogPreview, /Belum menerima pembelian/);
assert.doesNotMatch(catalogPreview, /api\/topup\/checkout/);
console.log('PASS: database-backed versioned preview catalog, safe public projections, and checkout isolation.');


const full = read('src/lib/topup/full-directory.ts');
const list = read('src/components/topup/TopupDirectory.tsx');
const page = read('src/app/topup/page.tsx');
assert.match(providers, /vipAllGameServices/);
assert.match(full, /TOPUP_FULL_CATALOG_PREVIEW_ENABLED/);
assert.match(full, /VERCEL_GIT_COMMIT_REF===scope/);
assert.match(full, /TOPUP_STORE_ENABLED!=='true'/);
assert.match(full, /CREATE TABLE IF NOT EXISTS topup_full_items/);
assert.ok(full.includes('PRIMARY KEY(version_id,row_index)'));
assert.match(full, /DUPLICATE_SKU/);
assert.match(full, /MANUAL_REVIEW/);
assert.match(full, /VIP_FULL_BACKUP_COUNT_MISMATCH/);
assert.match(full, /topup_full_active/);
assert.match(full, /retail_price/);
assert.doesNotMatch(full, /vipCreateOrder|TRIPAY_PRIVATE_KEY|GOPAY_GATEWAY_API_KEY/);
assert.match(page, /fullGames\.length/);
assert.match(list, /game\.total/);
assert.match(catalogPreview, /Hanya yang tersedia di katalog/);
console.log('PASS: full supplier catalog snapshot is isolated and handles all supplier categories with safe status labels.');

const prepaid = read('src/lib/topup/prepaid-directory.ts');
assert.match(providers, /vipAllPrepaidServices/);
assert.ok(providers.includes('https://vip-reseller.co.id/api/prepaid'));
assert.match(prepaid, /CREATE TABLE IF NOT EXISTS topup_prepaid_items/);
assert.match(prepaid, /DUPLICATE_SKU/);
assert.match(prepaid, /VIP_PREPAID_BACKUP_MISMATCH/);
assert.match(prepaid, /topup_prepaid_active/);
assert.ok(prepaid.includes('fullCatalogPreviewEnabled()'));
assert.match(page, /prepaidCategories/);
assert.match(gamePage, /prepaidCategory/);
assert.match(list, /sourceFilter/);
assert.doesNotMatch(prepaid, /vipCreateOrder|tripayCreatePayment|GOPAY_GATEWAY_API_KEY/);
console.log('PASS: VIP prepaid backup is versioned, validated, view-only and isolated from payment.');

const fullStatusRoute=read('src/app/api/topup/full-catalog/route.ts');
assert.match(fullStatusRoute,/fullCatalogPreviewEnabled/);
assert.match(fullStatusRoute,/snapshotBased:true,checkoutEnabled:false/);
assert.doesNotMatch(fullStatusRoute,/supplier_cost|cost:|VIPAY_API_KEY|TRIPAY_PRIVATE_KEY/);
console.log('PASS: full supplier directory backup status API only reveals sanitized readiness and counts.');
