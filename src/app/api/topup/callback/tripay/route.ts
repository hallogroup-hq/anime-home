import { NextRequest, NextResponse } from 'next/server';
import { validTripayCallback } from '@/lib/topup/providers';
import { processTripayCallback } from '@/lib/topup/engine';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > 10000 || request.headers.get('x-callback-event') !== 'payment_status' ||
      !validTripayCallback(raw, request.headers.get('x-callback-signature') || '')) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  try {
    await processTripayCallback(JSON.parse(raw));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 503 });
  }
}
