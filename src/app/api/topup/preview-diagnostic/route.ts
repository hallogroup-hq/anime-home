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
    profileFailure?: string;
    testEgressIp?: string;
  } = { profile: 'fail', catalog: 'fail', parsedProducts: 0, enabledProducts: 0 };

  try {
    const publicIP = await fetch('https://api4.ipify.org', {
      cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    const ip = (await publicIP.text()).trim();
    if (publicIP.ok && /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
        ip.split('.').every(value => Number(value) >= 0 && Number(value) < 256)) {
      response.testEgressIp = ip;
    }
  } catch {
    // Network check is independent of supplier credentials.
  }
  try {
    const profile = await vipProfile();
    if (profile.active) response.profile = 'pass';
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    response.profileFailure = /^(VIPAY_NOT_CONFIGURED|VIPAY_PROFILE_REJECTED(_(IP_RESTRICTION|API_NOT_ACTIVE|AUTH_REJECTED|UNKNOWN))?|VIPAY_PROFILE_HTTP_[0-9]{3})$/.test(message)
      ? message : (error instanceof Error && error.name === 'TimeoutError' ? 'VIPAY_TIMEOUT' : 'VIPAY_NETWORK_OR_UNEXPECTED');
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
