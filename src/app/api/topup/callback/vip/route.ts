import { NextRequest, NextResponse } from 'next/server';
import { vipWebhookSignature, safeEqualHex } from '@/lib/topup/providers';
import { processVipCallback } from '@/lib/topup/engine';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-client-signature') || '';
    if (Number(request.headers.get('content-length') || 0) > 10000 ||
      !safeEqualHex(signature, vipWebhookSignature())) {
      return NextResponse.json({ success: false }, { status: 401 });
    }
    const payload = await request.json();
    if (!payload?.data || typeof payload.data.trxid !== 'string') {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    await processVipCallback(payload.data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 503 });
  }
}
