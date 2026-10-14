import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckout } from '@/lib/topup/engine';

export const runtime = 'nodejs';
const schema = z.object({
  sku: z.string().min(2).max(100),
  targetId: z.string().min(3).max(120),
  zoneId: z.string().max(80).optional().default(''),
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
}).strict();

export async function POST(req: NextRequest) {
  try {
    if (Number(req.headers.get('content-length') || 0) > 4000) {
      return NextResponse.json({ error: 'REQUEST_TOO_LARGE' }, { status: 413 });
    }
    const input = schema.safeParse(await req.json());
    if (!input.success) return NextResponse.json({ error: 'DATA_INVALID' }, { status: 400 });
    const result = await createCheckout(input.data);
    return NextResponse.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'CHECKOUT_UNAVAILABLE';
    const known = /^(STORE_NOT_ACTIVE|PRODUCT_UNAVAILABLE|GAME_UNSUPPORTED|ZONE_REQUIRED|RATE_LIMITED|TARGET_INVALID|EMAIL_INVALID|NAME_INVALID|ZONE_INVALID|SKU_INVALID|PAYMENT_FEES_NEED_REVIEW)$/.test(code);
    const status = code === 'RATE_LIMITED' ? 429 : known ? 400 : 503;
    return NextResponse.json({ error: known ? code : 'CHECKOUT_UNAVAILABLE' }, { status });
  }
}
