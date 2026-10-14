import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { requestDynamicQRIS, verifyQRISStatus } from '../src/lib/services/paymentGateway';

async function main() {
  const file = readFileSync(resolve(process.cwd(), 'src/lib/services/paymentGateway.ts'), 'utf8');
  const occurrences = (file.match(/process\.env\.GOPAY_GATEWAY_API_KEY\?\.trim\(\)/g) || []).length;

  assert.equal(occurrences, 2, 'Both gateway calls must read the API key from server env');
  assert.doesNotMatch(file, /GOPAY_GATEWAY_API_KEY\s*\|\|/, 'No default API key is allowed in source');

  const previousKey = process.env.GOPAY_GATEWAY_API_KEY;
  const originalFetch = globalThis.fetch;
  let externalCalls = 0;

  try {
    delete process.env.GOPAY_GATEWAY_API_KEY;
    globalThis.fetch = (async () => {
      externalCalls += 1;
      throw new Error('Gateway must not be contacted without a configured API key');
    }) as typeof fetch;

    const qr = await requestDynamicQRIS(10000, { orderId: 'secret-boundary-test' });
    assert.equal(qr.success, true, 'Legacy merch local QR fallback remains unchanged');

    const status = await verifyQRISStatus('qris_missing_gateway_key', 'TRX-TEST', 10000);
    assert.equal(status.paid, false, 'No payment can be verified without gateway credentials');
    assert.equal(externalCalls, 0, 'Never attempt remote gateway authentication with an absent key');
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) {
      delete process.env.GOPAY_GATEWAY_API_KEY;
    } else {
      process.env.GOPAY_GATEWAY_API_KEY = previousKey;
    }
  }

  console.log('PASS: Gateway API key exclusively from environment; existing merchandise QR fallback preserved.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
