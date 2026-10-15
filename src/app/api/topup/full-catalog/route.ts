import { NextResponse } from 'next/server';
import { fullCatalogMeta, fullCatalogPreviewEnabled } from '@/lib/topup/full-directory';
import { prepaidMeta } from '@/lib/topup/prepaid-directory';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
  if(!fullCatalogPreviewEnabled())return new NextResponse(null,{status:404});
  try{
    const [game,prepaid]=await Promise.all([fullCatalogMeta(),prepaidMeta()]);
    return NextResponse.json({
      sources:{
        gameFeature: game ? {ready:true,products:game.total,available:game.available,
          categories:game.categories,capturedAt:game.capturedAt} : {ready:false},
        prepaid: prepaid ? {ready:true,products:prepaid.total,available:prepaid.available,
          categories:prepaid.categories,capturedAt:prepaid.capturedAt} : {ready:false},
      },
      ready:Boolean(game&&prepaid),
      snapshotBased:true,checkoutEnabled:false,
    },{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow'}});
  }catch{
    return NextResponse.json({error:'BACKUP_UNAVAILABLE'},{
      status:503,headers:{'Cache-Control':'no-store'}
    });
  }
}
