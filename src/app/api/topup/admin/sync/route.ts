import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { syncVipProducts } from '@/lib/topup/engine';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const configured = process.env.TOPUP_ADMIN_SYNC_KEY || '';
  const received = request.headers.get('authorization')?.replace(/^Bearer /i, '') || '';
  if (configured.length < 32 || received.length !== configured.length ||
      !timingSafeEqual(Buffer.from(received), Buffer.from(configured))) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  try {
    return NextResponse.json(await syncVipProducts(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'SYNC_FAILED' }, { status: 503 });
  }
}
