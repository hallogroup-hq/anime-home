import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { vipProfile } from '@/lib/topup/providers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const configured = process.env.TOPUP_ADMIN_SYNC_KEY || '';
  const received = request.headers.get('authorization')?.replace(/^Bearer /i, '') || '';
  if (configured.length < 32 || received.length !== configured.length ||
      !timingSafeEqual(Buffer.from(received), Buffer.from(configured))) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  try {
    const profile = await vipProfile();
    return NextResponse.json({
      connected: profile.active,
      supplier: 'VIPayment',
      tier: profile.level,
      balanceResponseValid: profile.balanceConfigured,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Never disclose upstream response bodies, tokens, account ID, or balance.
    return NextResponse.json({ connected: false, error: 'SUPPLIER_CONNECTION_FAILED' }, { status: 503 });
  }
}
