import { NextResponse } from 'next/server';
import { listGamesWithCounts, catalogCapturedAt, catalogPreviewEnabled } from '@/lib/topup/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    const games = await listGamesWithCounts();
    const capturedAt = await catalogCapturedAt();
    return NextResponse.json({
      games,
      previewCatalog: catalogPreviewEnabled(),
      backupReady: Boolean(capturedAt),
      capturedAt,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({
      games: [], previewCatalog: catalogPreviewEnabled(), backupReady: false,
      capturedAt: null, error: 'CATALOG_STORAGE_UNAVAILABLE',
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
