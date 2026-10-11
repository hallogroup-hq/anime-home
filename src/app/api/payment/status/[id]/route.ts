import { NextRequest, NextResponse } from 'next/server';
import { verifyQRISStatus } from '@/lib/services/paymentGateway';
import { db } from '@/lib/services/store';
import { checkRateLimit, getClientIp, isAllowedOrigin } from '@/lib/server/rateLimit';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Origin check
    if (!isAllowedOrigin(req)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden cross-site request' },
        { status: 403 }
      );
    }

    // 2. Rate limit check (polling max 40 checks/minute per IP)
    const ip = getClientIp(req);
    const rl = checkRateLimit(`qris_status_${ip}`, 40, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Terlalu sering memeriksa status pembayaran. Mohon tunggu.' },
        { status: 429 }
      );
    }

    const { id: qrisId } = await context.params;
    const { searchParams } = new URL(req.url);

    const trxId = searchParams.get('trx_id') || undefined;
    const orderId = searchParams.get('order_id') || undefined;
    const amountStr = searchParams.get('amount');
    const startTime = searchParams.get('start_time') || undefined;
    const amount = amountStr ? Math.round(Number(amountStr)) : undefined;

    // First check if the order in our database is already marked paid
    if (orderId) {
      const existingOrder = db.getOrderById(orderId);
      if (existingOrder && existingOrder.paymentStatus === 'paid') {
        return NextResponse.json({
          success: true,
          paid: true,
          status: 'PAID',
          order: existingOrder,
        });
      }
    }

    // Call GoPay gateway check
    const statusResult = await verifyQRISStatus(qrisId, trxId, amount, startTime);

    if (statusResult.paid && orderId) {
      const updatedOrder = db.updateOrderStatus(orderId, {
        paymentStatus: 'paid',
        dropshipStatus: 'pending_dispatch',
      });

      if (updatedOrder) {
        // Send auto receipt notification to CS live chat if not already sent
        const sessionKey = `session-${updatedOrder.customerContact.replace(/[^0-9]/g, '') || Date.now()}`;
        db.sendChatMessage({
          sessionId: sessionKey,
          sender: 'admin',
          senderName: 'Anime Home Store (GoPay Gateway)',
          message: `PEMBAYARAN DITERIMA: Transaksi GoPay Merchant #${orderId.slice(-6)} sebesar Rp ${updatedOrder.totalAmount.toLocaleString('id-ID')} telah BERHASIL diverifikasi lunas. Tim gudang kami sedang memproses packing pesanan.`,
          merchRef: {
            id: updatedOrder.merchId,
            name: updatedOrder.merchName,
            imageUrl: updatedOrder.merchImage,
            price: updatedOrder.totalAmount,
          },
        });
      }

      return NextResponse.json({
        success: true,
        paid: true,
        status: 'PAID',
        order: updatedOrder || undefined,
        transaction: statusResult.transaction,
      });
    }

    return NextResponse.json({
      success: true,
      paid: statusResult.paid,
      status: statusResult.status,
      transaction: statusResult.transaction,
    });
  } catch (error: any) {
    console.error('Error verifying payment status:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memverifikasi status pembayaran' },
      { status: 500 }
    );
  }
}

// POST endpoint for manual confirmation trigger by customer or admin webhook
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAllowedOrigin(req)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden cross-site request' },
        { status: 403 }
      );
    }

    const { id: qrisId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { orderId, trxId, amount, manualConfirmed } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Attempt gateway verification first
    const checkRes = await verifyQRISStatus(qrisId, trxId, amount);

    // If either gateway confirmed or manual confirmation requested
    const isPaid = checkRes.paid || Boolean(manualConfirmed);

    if (isPaid) {
      const updatedOrder = db.updateOrderStatus(orderId, {
        paymentStatus: 'paid',
        dropshipStatus: 'pending_dispatch',
      });

      if (updatedOrder) {
        const sessionKey = `session-${updatedOrder.customerContact.replace(/[^0-9]/g, '') || Date.now()}`;
        db.sendChatMessage({
          sessionId: sessionKey,
          sender: 'admin',
          senderName: 'Anime Home Store',
          message: `Terima kasih! Pembayaran pesanan #${orderId.slice(-6)} untuk "${updatedOrder.merchName}" (${updatedOrder.selectedVariant}) telah DIVERIFIKASI LUNAS via QRIS GoPay Merchant. Pesanan Anda kini masuk antrean pengiriman.`,
          merchRef: {
            id: updatedOrder.merchId,
            name: updatedOrder.merchName,
            imageUrl: updatedOrder.merchImage,
            price: updatedOrder.totalAmount,
          },
        });
      }

      return NextResponse.json({
        success: true,
        paid: true,
        status: 'PAID',
        order: updatedOrder,
      });
    }

    return NextResponse.json({
      success: true,
      paid: false,
      status: 'PENDING',
      message: 'Pembayaran belum terdeteksi di mutasi GoPay. Mohon pastikan sudah menyelesaikan transfer QRIS.',
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses konfirmasi pembayaran' },
      { status: 500 }
    );
  }
}
