import { NextRequest, NextResponse } from 'next/server';
import { publicOrderStatus } from '@/lib/topup/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!/^AHG-[A-F0-9]{20}$/.test(id)) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    if (Number(req.headers.get('content-length') || 0) > 1000) return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
    const input = await req.json();
    const result = await publicOrderStatus(id, typeof input?.token === 'string' ? input.token : '');
    return result
      ? NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
      : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'ORDER_UNAVAILABLE' }, { status: 503 });
  }
}
