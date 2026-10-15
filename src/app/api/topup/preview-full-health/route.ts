import { NextResponse } from 'next/server';
import { fullCatalogMeta, fullCatalogPreviewEnabled } from '@/lib/topup/full-directory';
import { vipProfile } from '@/lib/topup/providers';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET() {
  if(!fullCatalogPreviewEnabled()) return new NextResponse(null,{status:404});
  const result:{ready:boolean;total:number;categories:number;status:string;egressIp:string|null}={
    ready:false,total:0,categories:0,status:'NOT_TESTED',egressIp:null
  };
  try {
    const meta=await fullCatalogMeta();
    if(meta){result.ready=true;result.total=meta.total;result.categories=meta.categories;}
  }catch{result.status='DB_UNAVAILABLE';}
  try {
    await vipProfile();
    result.status='PROFILE_OK';
  }catch(e){
    const reason=e instanceof Error?e.message:'';
    result.status=reason==='VIPAY_PROFILE_REJECTED_IP_RESTRICTION'?'IP_NOT_ALLOWED':
      reason==='VIPAY_PROFILE_REJECTED_AUTH_REJECTED'?'AUTH_REJECTED':'PROVIDER_UNAVAILABLE';
  }
  try {
    const res=await fetch('https://api4.ipify.org',{cache:'no-store',signal:AbortSignal.timeout(4000)});
    const ip=(await res.text()).trim();
    if(res.ok && /^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) result.egressIp=ip;
  }catch{/* IP observation optional */}
  return NextResponse.json(result,{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow'}});
}
