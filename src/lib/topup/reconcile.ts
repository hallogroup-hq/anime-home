import 'server-only';
import { getOrder, topupDb } from './data';
import { processTripayCallback, reconcileSupplierOrder } from './engine';
import { tripayFetchPayment } from './providers';

export async function pollTopupOrder(id: string) {
  const order = await getOrder(id);
  if (!order) return;
  const checkPayment = order.state === 'AWAITING_PAYMENT' && Boolean(order.payment_reference);
  if (!checkPayment && order.state !== 'PROCESSING') return;
  const db = await topupDb();
  const lock = await db.execute({
    sql: "UPDATE topup_orders SET last_polled_at = CURRENT_TIMESTAMP WHERE id = ? AND state = ? AND (last_polled_at IS NULL OR last_polled_at < datetime('now', '-60 seconds'))",
    args: [id, order.state],
  });
  if (!lock.rowsAffected) return;
  try {
    if (checkPayment && order.payment_reference) {
      const detail = await tripayFetchPayment(order.payment_reference);
      if (detail.merchant_ref !== id) return;
      await processTripayCallback({
        merchant_ref: detail.merchant_ref,
        reference: detail.reference,
        status: detail.status,
        is_closed_payment: detail.is_closed_payment ?? 1,
        total_amount: detail.total_amount ?? (Number(detail.amount) + Number(detail.fee_customer || 0)),
        amount_received: detail.amount_received ?? (Number(detail.amount) - Number(detail.fee_merchant || 0)),
      });
    } else if (order.state === 'PROCESSING') {
      await reconcileSupplierOrder(id);
    }
  } catch {
    // Network errors must never implicitly confirm payment or retry fulfillment.
  }
}
