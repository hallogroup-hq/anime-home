import { NextResponse } from 'next/server';
import { vipProfile, vipCatalog } from '@/lib/topup/providers';
import { getClient, catalogPreviewEnabled } from '@/lib/topup/data';
import { getLatestCatalogMeta } from '@/lib/topup/catalog-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  if (!catalogPreviewEnabled()) return new NextResponse(null,{ status:404 });
  const outcome: {
    db:'ok'|'error'; supplier:'ok'|'error'; catalog:'ok'|'error';
    phase:string; reason:string|null; duplicates:number; total:number;
    available:number; backupReady:boolean; lastAttempt:string|null;
    failedVersions:number; egress:string|null;
  } = {
    db:'error',supplier:'error',catalog:'error',phase:'start',
    reason:null,duplicates:0,total:0,available:0,backupReady:false,
    lastAttempt:null,failedVersions:0,egress:null,
  };
  try {
    const d= getClient();
    const last=await getLatestCatalogMeta();
    outcome.backupReady=Boolean(last);
    const rs=await d.execute("SELECT last_attempt FROM topup_catalog_refresh WHERE id='vip'");
    outcome.lastAttempt=rs.rows.length?String(rs.rows[0].last_attempt):null;
    const bad=await d.execute("SELECT COUNT(*) AS cnt FROM topup_catalog_snapshots WHERE status='failed'");
    outcome.failedVersions=Number(bad.rows[0]?.cnt||0);
    outcome.db='ok';
  } catch {
    outcome.reason='DB_ACCESS_FAILED';
  }
  try {
    const profile = await vipProfile();
    if (!profile.active) throw new Error('PROFILE_NOT_ACTIVE');
    outcome.supplier='ok';
    outcome.phase='catalog';
    const products=await vipCatalog();
    outcome.total=products.length;
    outcome.available=products.filter(p=>p.available).length;
    const codes=new Set<string>();
    for(const p of products) { if(codes.has(p.sku)) outcome.duplicates++; else codes.add(p.sku); }
    outcome.catalog='ok';
    outcome.phase='done';
  } catch(err) {
    const message=err instanceof Error?err.message:'';
    const allowed=/^(?:VIPAY_NOT_CONFIGURED|VIPAY_PROFILE_HTTP_\d{3}|VIPAY_PROFILE_REJECTED(?:_(?:IP_RESTRICTION|API_NOT_ACTIVE|AUTH_REJECTED|UNKNOWN))?|VIPAY_HTTP_\d{3}|VIPAY_CATALOG_INVALID|VIPAY_REQUEST_REJECTED|PROFILE_NOT_ACTIVE)$/;
    outcome.reason=allowed.test(message)?message:outcome.reason||'SUPPLIER_OR_NETWORK_FAILURE';
  }
  try {
    const ipr=await fetch('https://api4.ipify.org',{cache:'no-store',signal:AbortSignal.timeout(4000)});
    const ip=(await ipr.text()).trim();
    if(ipr.ok && /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) outcome.egress=ip;
  } catch {}
  return NextResponse.json(outcome,{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow'}});
}
