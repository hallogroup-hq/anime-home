import { NextRequest, NextResponse } from 'next/server';
import { requestDynamicQRIS, GOPAY_MERCHANT_INFO } from '@/lib/services/paymentGateway';
import { checkRateLimit, getClientIp, isAllowedOrigin } from '@/lib/server/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. Origin verification (anti-CSRF)
    if (!isAllowedOrigin(req)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden cross-site request' },
        { status: 403 }
      );
    }

    // 2. Rate limiting (max 15 requests/minute per client IP)
    const ip = getClientIp(req);
    const rl = checkRateLimit(`qris_create_${ip}`, 15, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Terlalu banyak permintaan pembayaran. Silakan coba lagi dalam ${rl.resetSeconds} detik.` 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rl.resetSeconds),
            'X-RateLimit-Limit': String(rl.limit),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { amount, orderId, customerName } = body;

    const parsedAmount = Math.round(Number(amount));
    if (isNaN(parsedAmount) || parsedAmount < 1000 || parsedAmount > 50000000) {
      return NextResponse.json(
        { success: false, error: 'Nominal pembayaran tidak valid (Minimal Rp 1.000)' },
        { status: 400 }
      );
    }

    // 3. Request dynamic QRIS from GoPay Merchant Gateway
    const qrisResult = await requestDynamicQRIS(parsedAmount, {
      orderId: typeof orderId === 'string' ? orderId.slice(0, 80) : undefined,
      customerName: typeof customerName === 'string' ? customerName.slice(0, 100) : undefined,
    });

    if (!qrisResult.success) {
      return NextResponse.json(
        { success: false, error: qrisResult.message || 'Gagal membuat QRIS pembayaran' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        qris_id: qrisResult.qris_id,
        trx_id: qrisResult.trx_id,
        qris_code: qrisResult.qris_code,
        qris_image_url: qrisResult.qris_image_url,
        amount: qrisResult.amount,
        merchant_name: GOPAY_MERCHANT_INFO.merchantName,
        gopay_merchant_id: GOPAY_MERCHANT_INFO.gopayMerchantId,
        nmid: GOPAY_MERCHANT_INFO.nmid,
        city: GOPAY_MERCHANT_INFO.city,
        postal_code: GOPAY_MERCHANT_INFO.postalCode,
        expires_at: qrisResult.expires_at,
      },
    });
  } catch (error: any) {
    console.error('Error creating QRIS:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat membuat QRIS' },
      { status: 500 }
    );
  }
}
