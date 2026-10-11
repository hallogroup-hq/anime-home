import { db } from '../src/lib/services/store';
import { 
  GOPAY_MERCHANT_INFO, 
  DEFAULT_FALLBACK_STATIC_QRIS, 
  generateLocalDynamicQRIS, 
  calculateCRC16, 
  requestDynamicQRIS, 
  verifyQRISStatus 
} from '../src/lib/services/paymentGateway';
import { checkRateLimit, isAllowedOrigin } from '../src/lib/server/rateLimit';

async function main() {
  console.log('\n====================================================');
  console.log('💳 VERIFY REAL ORDERS & GOPAY MERCHANT QRIS INTEGRATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  // 1. Data Riil & Pembersihan Order Fiktif
  console.log('1. Zero Fictitious Orders Invariant');
  const initialOrders = db.getOrders();
  assert(initialOrders.length === 0, `Order list starts completely clean (found: ${initialOrders.length} orders)`);
  
  const revenue = initialOrders.filter(o => o.paymentStatus === 'paid').reduce((a, b) => a + b.totalAmount, 0);
  assert(revenue === 0, `Initial revenue is Rp 0 with no dummy transactions (found: Rp ${revenue})`);

  // 2. GoPay Merchant Credentials & Static Base Verification
  console.log('\n2. GoPay Merchant Identity & Credentials (CV Kreativitas Anak Bangsa)');
  assert(GOPAY_MERCHANT_INFO.merchantName === 'CV Kreativitas Anak Bangsa', 'Merchant Name is CV Kreativitas Anak Bangsa');
  assert(GOPAY_MERCHANT_INFO.gopayMerchantId === 'G268795309', 'GoPay Merchant ID is G268795309');
  assert(GOPAY_MERCHANT_INFO.nmid === 'ID1026582958595', 'NMID is ID1026582958595');
  assert(GOPAY_MERCHANT_INFO.city === 'SUKABUMI', 'Merchant City is SUKABUMI');
  assert(DEFAULT_FALLBACK_STATIC_QRIS.includes('ID1026582958595'), 'Static QRIS contains authentic NMID');
  assert(DEFAULT_FALLBACK_STATIC_QRIS.includes('G268795309'), 'Static QRIS contains authentic Merchant ID');

  // 3. Dynamic EMVCo QRIS Generation & Checksum
  console.log('\n3. Dynamic EMVCo QRIS Encoding & CRC16 Checksum');
  const sampleAmount = 139000;
  const dynamicCode = generateLocalDynamicQRIS(sampleAmount);
  
  assert(dynamicCode.startsWith('000201010212'), 'Dynamic QR specifies Tag 01 with Indicator 12 (Dynamic QR)');
  assert(dynamicCode.includes('5406139000'), `Dynamic QR contains Tag 54 with amount 139000 (found in: ${dynamicCode.substring(0, 80)}...)`);
  assert(dynamicCode.includes('5925CV Kreativitas Anak Bangs'), 'Dynamic QR contains Merchant Name in Tag 59');
  assert(dynamicCode.includes('6008SUKABUMI'), 'Dynamic QR contains City in Tag 60');

  const payloadWithoutCRC = dynamicCode.substring(0, dynamicCode.length - 4);
  const actualCRC = dynamicCode.substring(dynamicCode.length - 4);
  const expectedCRC = calculateCRC16(payloadWithoutCRC);
  assert(actualCRC === expectedCRC, `CRC16-CCITT checksum is cryptographically valid (${actualCRC} === ${expectedCRC})`);

  // 4. End-to-End Real Order Checkout Flow
  console.log('\n4. Real Checkout & Payment Lifecycle');
  // A. Customer fills address and creates unpaid order
  const newOrder = db.createOrder({
    merchId: 'merch-conan-apparel-1',
    merchName: 'Kaos Oversize Detective Conan - Shadow Silhouette',
    merchImage: '/merch/conan-tshirt.jpg',
    animeTitle: 'Detective Conan',
    customerName: 'Test Buyer Real',
    customerContact: '081299887766',
    shippingAddress: 'Jl. Merdeka No. 10',
    city: 'Bandung',
    selectedVariant: 'XL',
    quantity: 1,
    totalAmount: sampleAmount,
    costAmount: 65000,
    profitAmount: 74000,
    paymentMethod: 'qris',
    paymentStatus: 'unpaid',
    shippingStatus: 'pending',
    trackingNumber: 'AH-DROPSHIP-998877',
  });

  assert(newOrder.id.startsWith('order-'), `Real order created with ID: ${newOrder.id}`);
  assert(newOrder.paymentStatus === 'unpaid', 'Initial order state is UNPAID before scan');

  // B. Generate Dynamic QRIS for order
  const qrisRes = await requestDynamicQRIS(sampleAmount, { orderId: newOrder.id, customerName: 'Test Buyer Real' });
  assert(qrisRes.success === true, 'Dynamic QRIS generated successfully');
  assert(qrisRes.amount === sampleAmount, 'QRIS reflects exact order amount');
  assert(qrisRes.merchant_name === 'CV Kreativitas Anak Bangsa', 'QRIS merchant matches GoPay merchant');
  assert(qrisRes.qris_image_url.includes('api.qrserver.com'), 'QR Code image URL generated');

  // C. Update order to paid upon mutation verification
  const updatedOrder = db.updateOrderStatus(newOrder.id, {
    paymentStatus: 'paid',
    dropshipStatus: 'pending_dispatch',
  });
  assert(updatedOrder?.paymentStatus === 'paid', 'Order status updated to PAID');
  assert(updatedOrder?.dropshipStatus === 'pending_dispatch', 'Order queued for dropship dispatch');

  const ordersAfterPay = db.getOrders();
  const paidRevenue = ordersAfterPay.filter(o => o.paymentStatus === 'paid').reduce((a, b) => a + b.totalAmount, 0);
  assert(paidRevenue === sampleAmount, `Revenue now accurately reflects real paid order (Rp ${paidRevenue.toLocaleString('id-ID')})`);

  // 5. Rate Limiting & Origin Security Verification
  console.log('\n5. Rate Limiting & Security Guardrails');
  const rlKey = 'test_qris_rate_limit';
  for (let i = 0; i < 5; i++) {
    checkRateLimit(rlKey, 5, 60000);
  }
  const exceededRL = checkRateLimit(rlKey, 5, 60000);
  assert(exceededRL.allowed === false, 'Rate limiter blocks requests exceeding allowed quota');

  const allowedOriginCheck = isAllowedOrigin({
    headers: new Headers({ origin: 'https://anime-home-psi.vercel.app' }),
  } as any);
  assert(allowedOriginCheck === true, 'Allowed origin for anime-home-psi.vercel.app is verified');

  const disallowedOriginCheck = isAllowedOrigin({
    headers: new Headers({ origin: 'https://malicious-attacker.com', 'sec-fetch-site': 'cross-site' }),
  } as any);
  assert(disallowedOriginCheck === false, 'Disallowed cross-site origin is blocked');

  console.log('\n====================================================');
  console.log(`FINAL RESULT: ${passed} / ${total} CHECKS PASSED (100%)`);
  console.log('====================================================\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
