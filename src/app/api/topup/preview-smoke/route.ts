import { NextResponse } from 'next/server';
import { vipProfile, vipCatalog } from '@/lib/topup/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview' ||
    process.env.VERCEL_GIT_COMMIT_REF !== 'feat/digital-topup-store-foundation-20261014' ||
    process.env.TOPUP_STORE_ENABLED === 'true') return new NextResponse(null, { status: 404 });
  const output: { profile: boolean; catalog: boolean; products: number; available: number; egress?: string; error?: string } =
    { profile: false, catalog: false, products: 0, available: 0 };

  try {
    const resp = await fetch('https://api4.ipify.org', { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    const ip = (await resp.text()).trim();
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) output.egress = ip;
  } catch { /* IP observation is optional. */ }

  try {
    await vipProfile();
    output.profile = true;
    const products = await vipCatalog();
    output.catalog = true;
    output.products = products.length;
    output.available = products.filter(x => x.available).length;
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    output.error = /^VIPAY_(PROFILE_REJECTED_(?:IP_RESTRICTION|AUTH_REJECTED|API_NOT_ACTIVE|UNKNOWN)|PROFILE_HTTP_\d{3}|PROFILE_REJECTED|NOT_CONFIGURED|CATALOG_INVALID|REQUEST_REJECTED|HTTP_\d{3})$/.test(message)
      ? message : 'UPSTREAM_ERROR';
  }
  return NextResponse.json(output, {
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}
