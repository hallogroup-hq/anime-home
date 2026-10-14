import { NextResponse } from 'next/server';
import { vipProfile, vipCatalog } from '@/lib/topup/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Temporary read-only diagnostics. Not callable from production, development,
  // other previews, or after the store has been opened for actual purchases.
  const safe = process.env.VERCEL_ENV === 'preview' &&
    process.env.VERCEL_GIT_COMMIT_REF === 'feat/digital-topup-store-foundation-20261014' &&
    process.env.TOPUP_STORE_ENABLED !== 'true';
  if (!safe) return new NextResponse(null, { status: 404 });

  const response: {
    profile: 'pass' | 'fail';
    catalog: 'pass' | 'fail';
    parsedProducts: number;
    enabledProducts: number;
  } = { profile: 'fail', catalog: 'fail', parsedProducts: 0, enabledProducts: 0 };

  try {
    const profile = await vipProfile();
    if (profile.active) response.profile = 'pass';
  } catch {
    // Do not expose upstream account details or error strings.
  }
  if (response.profile === 'pass') {
    try {
      const items = await vipCatalog();
      response.catalog = 'pass';
      response.parsedProducts = items.length;
      response.enabledProducts = items.filter(item => item.available).length;
    } catch {
      // Do not expose upstream account details or error strings.
    }
  }
  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}
