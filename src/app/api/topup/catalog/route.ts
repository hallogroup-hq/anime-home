import { NextResponse } from 'next/server';
import { listGamesWithCounts, catalogCapturedAt, catalogPreviewEnabled } from '@/lib/topup/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    const games = await listGamesWithCounts();
    const capturedAt = await catalogCapturedAt();
    let outboundIp: string | null = null;
    if (catalogPreviewEnabled() && !capturedAt) {
      try {
        const check = await fetch('https://api4.ipify.org', { cache: 'no-store', signal: AbortSignal.timeout(4000) });
        const value = (await check.text()).trim();
        if (check.ok && /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value) && value.split('.').every(part => Number(part) <= 255)) outboundIp = value;
      } catch { /* no IP diagnostic if network is inaccessible */ }
    }
    return NextResponse.json({
      games,
      previewCatalog: catalogPreviewEnabled(),
      backupReady: Boolean(capturedAt),
      capturedAt,
      ...(outboundIp ? { observedPreviewEgressIp: outboundIp } : {}),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({
      games: [], previewCatalog: catalogPreviewEnabled(), backupReady: false,
      capturedAt: null, error: 'CATALOG_STORAGE_UNAVAILABLE',
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
