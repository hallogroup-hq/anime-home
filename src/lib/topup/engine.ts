import 'server-only';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { getOrder, productBySku, gameConfig, visibleGame, topupDb } from './data';
import { tripayCreatePayment, vipCreateOrder, vipCatalog, vipCheckOrder } from './providers';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function syncVipProducts() {
  const products = await vipCatalog();
  if (products.length === 0) throw new Error('VIPAY_CATALOG_EMPTY_REJECTED');
  const db = await topupDb();
  // Atomic replacement prevents a failed refresh from leaving half a catalog online.
  await db.batch([
    { sql: 'UPDATE topup_products SET available = 0', args: [] },
    ...products.map(product => ({
      sql: `INSERT INTO topup_products
        (sku, game_slug, game_name, name, description, cost, price, available, synced_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(sku) DO UPDATE SET game_slug=excluded.game_slug,
        game_name=excluded.game_name, name=excluded.name, description=excluded.description,
        cost=excluded.cost, price=excluded.price, available=excluded.available,
        synced_at=CURRENT_TIMESTAMP`,
      args: [product.sku, product.gameSlug, product.gameName, product.name,
        product.description, product.cost, product.price, product.available ? 1 : 0],
    })),
  ], 'write');
  return { total: products.length, available: products.filter(p => p.available).length };
}

type CheckoutInput = { sku: string; targetId: string; zoneId?: string; email: string; name: string };

export function validateCheckout(input: CheckoutInput) {
  if (!/^[A-Z0-9._-]{2,100}$/i.test(input.sku)) throw new Error('SKU_INVALID');
  if (input.targetId.trim().length < 3 || input.targetId.length > 120 ||
      /[<>]/.test(input.targetId)) throw new Error('TARGET_INVALID');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email) || input.email.length > 200) throw new Error('EMAIL_INVALID');
  if (input.name.trim().length < 2 || input.name.length > 100) throw new Error('NAME_INVALID');
  if ((input.zoneId || '').length > 80 || /[<>]/.test(input.zoneId || '')) throw new Error('ZONE_INVALID');
}

export async function createCheckout(input: CheckoutInput) {
  if (process.env.TOPUP_STORE_ENABLED !== 'true' || !process.env.VIPAY_API_ID || !process.env.VIPAY_API_KEY) throw new Error('STORE_NOT_ACTIVE');
  validateCheckout(input);
  const product = await productBySku(input.sku);
  if (!product || !product.available || !visibleGame(product.gameSlug)) throw new Error('PRODUCT_UNAVAILABLE');
  const game = gameConfig(product.gameSlug);
  if (!game) throw new Error('GAME_UNSUPPORTED');
  if (game.requiresZone && !input.zoneId?.trim()) throw new Error('ZONE_REQUIRED');

  const db = await topupDb();
  const email = input.email.trim().toLowerCase();
  const tooMany = await db.execute({
    sql: `SELECT COUNT(*) AS count FROM topup_orders WHERE email = ? AND created_at > datetime('now', '-10 minutes')`,
    args: [email],
  });
  if (Number(tooMany.rows[0]?.count || 0) >= 4) throw new Error('RATE_LIMITED');

  const id = 'AHG-' + randomUUID().replace(/-/g, '').slice(0, 20).toUpperCase();
  const receiptToken = randomBytes(32).toString('hex');
  await db.execute({
    sql: `INSERT INTO topup_orders
      (id, sku, game_slug, product_name, email, customer_name, target_id, zone_id,
      amount, cost, payable_amount, token_hash, state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAYMENT_CREATING')`,
    args: [id, product.sku, product.gameSlug, product.name, email,
      input.name.trim(), input.targetId.trim(), (input.zoneId || '').trim(),
      product.price, product.cost, product.price, hashToken(receiptToken)],
  });

  try {
    const payment = await tripayCreatePayment({
      id, amount: product.price, name: input.name.trim(), email, productName: product.name,
    });
    const payable = Number(payment.total_amount ?? (product.price + Number(payment.fee_customer || 0)));
    const net = Number(payment.amount_received ?? (product.price - Number(payment.fee_merchant || 0)));
    if (!Number.isSafeInteger(payable) || payable < product.price ||
        !Number.isSafeInteger(net) || net <= product.cost) {
      await db.execute({
        sql: "UPDATE topup_orders SET state = 'MANUAL_REVIEW' WHERE id = ?",
        args: [id],
      });
      throw new Error('PAYMENT_FEES_NEED_REVIEW');
    }

    const checkoutUrl = typeof payment.checkout_url === 'string' && payment.checkout_url.startsWith('https://tripay.co.id/')
      ? payment.checkout_url : null;
    const qrUrl = typeof payment.qr_url === 'string' && payment.qr_url.startsWith('https://')
      ? payment.qr_url : null;

    await db.execute({
      sql: `UPDATE topup_orders SET payment_reference = ?, checkout_url = ?,
        qr_url = ?, pay_code = ?, payable_amount = ?,
        state = CASE WHEN state = 'PAYMENT_CREATING' THEN 'AWAITING_PAYMENT' ELSE state END,
        updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [payment.reference, checkoutUrl, qrUrl, payment.pay_code || null, payable, id],
    });
    return { id, receiptToken, checkoutUrl };
  } catch (error) {
    await db.execute({
      sql: "UPDATE topup_orders SET state = 'PAYMENT_ERROR' WHERE id = ? AND state = 'PAYMENT_CREATING'",
      args: [id],
    });
    throw error;
  }
}

export async function fulfillConfirmedOrder(id: string) {
  const db = await topupDb();
  // Atomic claim. VIPayment does not document a merchant-side idempotency key;
  // therefore never auto-retry an ambiguous supplier request.
  const claim = await db.execute({
    sql: "UPDATE topup_orders SET state = 'FULFILLING', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND state = 'PAYMENT_CONFIRMED'",
    args: [id],
  });
  if (!claim.rowsAffected) return false;
  const order = await getOrder(id);
  if (!order) return false;
  try {
    const freshProduct = (await vipCatalog()).find(item => item.sku === order.sku && item.available);
    const costReserve = Math.max(300, Math.ceil(Number(order.amount) * 0.015));
    if (!freshProduct || freshProduct.cost + costReserve >= Number(order.amount)) {
      throw new Error('SUPPLIER_PRICE_CHANGED');
    }
    const response = await vipCreateOrder(order.sku, order.target_id, order.zone_id);
    const status = String(response.status || '').toLowerCase();
    const nextState = status === 'success' ? 'COMPLETED' : status === 'error' ? 'FULFILLMENT_FAILED' : 'PROCESSING';
    await db.execute({
      sql: 'UPDATE topup_orders SET vendor_trx_id = ?, state = ?, delivery_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND state = ?',
      args: [String(response.trxid), nextState, String(response.note || '').slice(0, 1000), id, 'FULFILLING'],
    });
    return true;
  } catch {
    await db.execute({
      sql: "UPDATE topup_orders SET state = 'MANUAL_REVIEW', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND state = 'FULFILLING'",
      args: [id],
    });
    return false;
  }
}

type TripayCallback = {
  merchant_ref?: string; reference?: string; total_amount?: number; fee_merchant?: number;
  amount_received?: number; fee_customer?: number; status?: string; is_closed_payment?: number;
};

export async function processTripayCallback(event: TripayCallback) {
  if (!event.merchant_ref || !event.reference || !event.status) throw new Error('PAYMENT_CALLBACK_INVALID');
  const order = await getOrder(event.merchant_ref);
  if (!order) throw new Error('PAYMENT_ORDER_NOT_FOUND');
  if (order.payment_reference && order.payment_reference !== event.reference) throw new Error('PAYMENT_REFERENCE_MISMATCH');
  if (Number(event.is_closed_payment) !== 1) throw new Error('PAYMENT_TYPE_INVALID');
  const receivedTotal = Number(event.total_amount);
  const expectedTotal = order.state === 'PAYMENT_CREATING'
    ? Number(order.amount) + Number(event.fee_customer || 0) : Number(order.payable_amount);
  if (!Number.isSafeInteger(receivedTotal) || receivedTotal !== expectedTotal) {
    throw new Error('PAYMENT_AMOUNT_MISMATCH');
  }
  const db = await topupDb();
  if (event.status === 'PAID') {
    const afterFee = Number(event.amount_received);
    if (!Number.isSafeInteger(afterFee) || afterFee <= Number(order.cost)) {
      await db.execute({
        sql: "UPDATE topup_orders SET state = 'MANUAL_REVIEW' WHERE id = ? AND state IN ('PAYMENT_CREATING','AWAITING_PAYMENT')",
        args: [order.id],
      });
      return;
    }
    await db.execute({
      sql: `UPDATE topup_orders SET state = 'PAYMENT_CONFIRMED',
        payment_reference = COALESCE(payment_reference, ?), updated_at=CURRENT_TIMESTAMP
        WHERE id = ? AND state IN ('PAYMENT_CREATING','AWAITING_PAYMENT')
        AND (payment_reference IS NULL OR payment_reference = ?)`,
      args: [event.reference, order.id, event.reference],
    });
    if (process.env.TRIPAY_MODE !== 'production') {
      await db.execute({
        sql: "UPDATE topup_orders SET state = 'SANDBOX_PAID' WHERE id = ? AND state = 'PAYMENT_CONFIRMED'",
        args: [order.id],
      });
      return;
    }
    await fulfillConfirmedOrder(order.id);
  } else if (event.status === 'EXPIRED' || event.status === 'FAILED') {
    await db.execute({
      sql: "UPDATE topup_orders SET state = ? WHERE id = ? AND state IN ('PAYMENT_CREATING','AWAITING_PAYMENT')",
      args: [event.status === 'EXPIRED' ? 'PAYMENT_EXPIRED' : 'PAYMENT_FAILED', order.id],
    });
  } else if (event.status === 'REFUND') {
    await db.execute({
      sql: "UPDATE topup_orders SET state = 'MANUAL_REVIEW' WHERE id = ? AND state NOT IN ('COMPLETED')",
      args: [order.id],
    });
  }
}

export async function processVipCallback(event: {
  trxid: string; status: string; note?: string;
}) {
  if (!event.trxid || !['waiting', 'processing', 'success', 'error'].includes(event.status)) {
    throw new Error('VIP_CALLBACK_INVALID');
  }
  const db = await topupDb();
  const next = event.status === 'success' ? 'COMPLETED' :
    event.status === 'error' ? 'FULFILLMENT_FAILED' : 'PROCESSING';
  await db.execute({
    sql: `UPDATE topup_orders SET state = ?, delivery_note = ?, updated_at = CURRENT_TIMESTAMP
      WHERE vendor_trx_id = ? AND state = 'PROCESSING'`,
    args: [next, String(event.note || '').slice(0, 1000), event.trxid],
  });
}

export async function reconcileSupplierOrder(orderId: string) {
  const order = await getOrder(orderId);
  if (!order || order.state !== 'PROCESSING' || !order.vendor_trx_id) return null;
  const actual = await vipCheckOrder(order.vendor_trx_id);
  await processVipCallback({ trxid: order.vendor_trx_id, status: String(actual.status || '').toLowerCase(), note: actual.note });
  return getOrder(orderId);
}

export async function publicOrderStatus(id: string, token: string) {
  const order = await getOrder(id);
  if (!order || !/^[0-9a-f]{64}$/.test(token) || order.token_hash !== hashToken(token)) return null;
  return {
    id: order.id, gameSlug: order.game_slug, product: order.product_name,
    amount: Number(order.amount), payableAmount: Number(order.payable_amount),
    state: order.state, checkoutUrl: order.checkout_url,
    qrUrl: order.qr_url, payCode: order.pay_code,
    target: order.target_id, zone: order.zone_id,
    note: order.state === 'COMPLETED' ? order.delivery_note : null,
    createdAt: order.created_at,
  };
}
