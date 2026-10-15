import { NextResponse } from 'next/server';
import { vipCatalog, vipProfile } from '@/lib/topup/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview' ||
      process.env.VERCEL_GIT_COMMIT_REF !== 'feat/digital-topup-store-foundation-20261014' ||
      process.env.TOPUP_STORE_ENABLED === 'true') return new NextResponse(null,{status:404});

  try {
    await vipProfile();
    const candidates = await vipCatalog();
    // Read-only snapshot export of public sale fields. NEVER expose wholesale supplier cost.
    const items = candidates.filter(p => p.available).map(p=>({
      sku:p.sku, gameSlug:p.gameSlug, name:p.name,
      description:p.description, price:p.price
    }));
    return NextResponse.json({
      source:'vipayment-game-feature', capturedAt:new Date().toISOString(),
      totalParsed:candidates.length, availableCount:items.length, items
    },{headers:{'Cache-Control':'private,no-store','X-Robots-Tag':'noindex,nofollow'}});
  } catch (error) {
    const diagnostic = error instanceof Error && /^VIPAY_(?:PROFILE_(?:REJECTED(?:_(?:IP_RESTRICTION|AUTH_REJECTED|API_NOT_ACTIVE|UNKNOWN))?|HTTP_\\d{3})|REQUEST_REJECTED|HTTP_\\d{3}|CATALOG_INVALID|NOT_CONFIGURED)$/.test(error.message) ? error.message : 'VIPAY_OTHER_FAILURE';
    let observedEgress: string | null = null;
    try {
      const ipResponse = await fetch('https://api4.ipify.org', {cache:'no-store',signal:AbortSignal.timeout(4500)});
      const ip = (await ipResponse.text()).trim();
      if (ipResponse.ok && /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) observedEgress = ip;
    } catch { /* Diagnostics only: do not include upstream errors or credentials. */ }
    return NextResponse.json({error:'SUPPLIER_UNAVAILABLE',diagnostic,observedEgress}, {status:503,headers:{'Cache-Control':'no-store'}});
  }
}
