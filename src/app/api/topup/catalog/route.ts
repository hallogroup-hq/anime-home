import { NextResponse } from 'next/server';
import { listGamesWithCounts } from '@/lib/topup/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const games = await listGamesWithCounts();
    return NextResponse.json({ games }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ games: [] }, { status: 503 });
  }
}
