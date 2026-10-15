import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { getClient, GAMES, pricingForCost } from './data';
import { vipAllGameServices } from './providers';

type SourceItem = {
  code:string; game:string; name:string; description:string; cost:number|null;
  price:number|null; status:string; sourceIndex:number;
};
export type FullCatalogItem = {
  id:number; sku:string; name:string; description:string; price:number|null;
  available:boolean; review:boolean; supplierGroup:string;
};
export type FullCatalogCategory = {
  slug:string; name:string; short:string; accent:string; count:number;
  total:number; fromPrice:number|null; source:'game-feature';
};
type FullVersion = {id:string;capturedAt:string;total:number;available:number;categories:number};
const scope='feat/digital-topup-store-foundation-20261014';
export function fullCatalogPreviewEnabled() {
  return process.env.VERCEL_ENV==='preview' &&
    process.env.VERCEL_GIT_COMMIT_REF===scope &&
    process.env.TOPUP_FULL_CATALOG_PREVIEW_ENABLED==='true' &&
    process.env.TOPUP_STORE_ENABLED!=='true';
}

function categoryIdentity(group:string) {
  const cleaned=group.trim().replace(/\s+/g,' ');
  const exact=GAMES.find(g=>g.match.test(cleaned) && !/gift|joki|akun|account|skin|boost/i.test(cleaned));
  if(exact) return {slug:exact.slug,name:exact.name,short:exact.short,accent:exact.accent};
  const url=cleaned.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55).replace(/-+$/,'') || 'kategori';
  const hash=createHash('sha256').update(cleaned.toLocaleLowerCase('en')).digest('hex').slice(0,9);
  const short=cleaned.split(/\s+/).slice(0,2).map(word=>word[0]||'').join('').toUpperCase().slice(0,4) || 'DG';
  return {slug:'vip-'+url+'-'+hash,name:cleaned,short,accent:'#8F94A5'};
}
const unsafe=/\b(joki|akun|account|login|password|boost(?:ing)?|sewa|rental|gift|skin|manual|social|followers|likes|view|subscription sharing)\b/i;
const dbReady: {promise?:Promise<void>}={};
async function db() {
  const client=getClient();
  if(!dbReady.promise) {
    dbReady.promise=client.batch([
      `CREATE TABLE IF NOT EXISTS topup_full_versions (
        id TEXT PRIMARY KEY, source TEXT NOT NULL, captured_at TEXT NOT NULL,
        total INTEGER NOT NULL, available INTEGER NOT NULL,
        categories INTEGER NOT NULL, status TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS topup_full_items (
        version_id TEXT NOT NULL, row_index INTEGER NOT NULL, supplier_sku TEXT NOT NULL,
        category_slug TEXT NOT NULL, category_name TEXT NOT NULL, category_short TEXT NOT NULL,
        accent TEXT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL,
        cost INTEGER, retail_price INTEGER, available INTEGER NOT NULL,
        needs_review INTEGER NOT NULL, reason TEXT NOT NULL,
        supplier_group TEXT NOT NULL,
        PRIMARY KEY(version_id,row_index)
      )`,
      'CREATE INDEX IF NOT EXISTS topup_full_items_category ON topup_full_items(version_id,category_slug,available,retail_price)',
      `CREATE TABLE IF NOT EXISTS topup_full_active (
        source TEXT PRIMARY KEY, version_id TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS topup_full_refresh (
        source TEXT PRIMARY KEY,last_attempt TEXT NOT NULL
      )`,
      {sql:"INSERT OR IGNORE INTO topup_full_refresh(source,last_attempt) VALUES ('game-feature','1970-01-01 00:00:00')",args:[]}
    ],'write').then(()=>undefined).catch(e=>{dbReady.promise=undefined;throw e;});
  }
  await dbReady.promise;
  return client;
}
export async function fullCatalogMeta():Promise<FullVersion|null> {
  const client=await db();
  const r=await client.execute(`SELECT v.id,v.captured_at,v.total,v.available,v.categories
    FROM topup_full_active a JOIN topup_full_versions v ON v.id=a.version_id
    WHERE a.source='game-feature' AND v.status='ready' LIMIT 1`);
  if(!r.rows.length)return null;
  const x=r.rows[0];
  return {id:String(x.id),capturedAt:String(x.captured_at),total:Number(x.total),
    available:Number(x.available),categories:Number(x.categories)};
}
function normalize(items: Awaited<ReturnType<typeof vipAllGameServices>>):SourceItem[] {
  const safe:SourceItem[]=[];
  items.forEach((item,sourceIndex)=>{
    const game=typeof item.game==='string'?item.game.trim():'';
    const name=typeof item.name==='string'?item.name.trim():'';
    const code=typeof item.code==='string'?item.code.trim():'';
    if(!game || !name || !code || game.length>170 || code.length>140) return;
    const price=Number(item.price?.basic);
    const cost=Number.isSafeInteger(price)&&price>0&&price<=100_000_000?price:null;
    const sale=cost===null?null:pricingForCost(cost);
    const description=(typeof item.description==='string'?item.description:'')
      .replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ')
      .replace(/\s+/g,' ').trim().slice(0,1200);
    safe.push({code,game:game.slice(0,160),name:name.slice(0,200),
      description,cost,price:sale,status:typeof item.status==='string'?item.status.toLowerCase():'unknown',
      sourceIndex});
  });
  return safe;
}
async function importFull() {
  const raw=await vipAllGameServices();
  if(raw.length<10)throw new Error('VIP_FULL_SOURCE_EMPTY');
  const items=normalize(raw);
  if(items.length<10)throw new Error('VIP_FULL_NORMALIZED_EMPTY');
  const frequency=new Map<string,number>();
  for(const p of items) frequency.set(p.code,(frequency.get(p.code)||0)+1);
  const prepared=items.map(p=>{
    const cat=categoryIdentity(p.game);
    const reason=(frequency.get(p.code)||0)>1?'DUPLICATE_SKU':
      unsafe.test(p.game+' '+p.name+' '+p.description)?'MANUAL_REVIEW':
      p.cost===null||p.price===null?'INVALID_PRICE':
      p.status!=='available'?'UNAVAILABLE':'READY_FOR_CATALOG';
    const available=p.status==='available'&&p.price!==null&&reason==='READY_FOR_CATALOG';
    return {p,cat,reason,available};
  });
  const categories=new Set(prepared.map(x=>x.cat.slug)).size;
  const available=prepared.filter(x=>x.available).length;
  if(categories<2||available<1)throw new Error('VIP_FULL_SAFE_CATALOG_EMPTY');
  const id=randomUUID(),capturedAt=new Date().toISOString(),client=await db();
  await client.execute({sql:`INSERT INTO topup_full_versions
    (id,source,captured_at,total,available,categories,status)
    VALUES (?,?,?,?,?,?,'importing')`,
    args:[id,'game-feature',capturedAt,prepared.length,available,categories]});
  try {
    const statements:Array<{sql:string;args:(string|number|null)[]}>=[];
    for(let i=0;i<prepared.length;i+=48) {
      const part=prepared.slice(i,i+48);
      statements.push({
        sql:`INSERT INTO topup_full_items
          (version_id,row_index,supplier_sku,category_slug,category_name,category_short,
            accent,name,description,cost,retail_price,available,needs_review,reason,supplier_group)
          VALUES ${part.map(()=>'(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',')}`,
        args:part.flatMap(x=>[
          id,x.p.sourceIndex,x.p.code,x.cat.slug,x.cat.name,x.cat.short,x.cat.accent,
          x.p.name,x.p.description,x.p.cost,x.p.price,x.available?1:0,
          x.reason==='MANUAL_REVIEW'||x.reason==='DUPLICATE_SKU'?1:0,
          x.reason,x.p.game
        ])
      });
    }
    for(let i=0;i<statements.length;i+=6)await client.batch(statements.slice(i,i+6),'write');
    const verification=await client.execute({sql:`SELECT COUNT(*) AS total,
      COALESCE(SUM(available),0) AS available,COUNT(DISTINCT category_slug) AS categories
      FROM topup_full_items WHERE version_id=?`,args:[id]});
    const v=verification.rows[0];
    if(Number(v?.total)!==prepared.length||Number(v?.available)!==available||
       Number(v?.categories)!==categories)throw new Error('VIP_FULL_BACKUP_COUNT_MISMATCH');
    await client.batch([
      {sql:"UPDATE topup_full_versions SET status='ready' WHERE id=?",args:[id]},
      {sql:"INSERT INTO topup_full_active(source,version_id) VALUES ('game-feature',?) ON CONFLICT(source) DO UPDATE SET version_id=excluded.version_id",args:[id]}
    ],'write');
  }catch{
    await client.execute({sql:"UPDATE topup_full_versions SET status='failed' WHERE id=? AND status='importing'",args:[id]}).catch(()=>{});
    throw new Error('VIP_FULL_BACKUP_WRITE_FAILED');
  }
}
export async function ensureFullCatalog(){
  if(!fullCatalogPreviewEnabled())return;
  const existing=await fullCatalogMeta();
  if(existing&&Date.now()-Date.parse(existing.capturedAt)<24*3600_000)return;
  const client=await db();
  const claim=await client.execute({sql:`UPDATE topup_full_refresh SET last_attempt=CURRENT_TIMESTAMP
    WHERE source='game-feature' AND last_attempt<datetime('now','-5 minutes')`,args:[]});
  if(!claim.rowsAffected)return;
  try{await importFull();}catch{
    // Supplier IP may change: a previous successful version remains active.
  }
}
export async function fullCategories():Promise<FullCatalogCategory[]>{
  await ensureFullCatalog();
  const meta=await fullCatalogMeta();if(!meta)return [];
  const client=await db();
  const rs=await client.execute({sql:`SELECT category_slug,category_name,category_short,accent,
    COUNT(*) AS total,COALESCE(SUM(available),0) AS count,
    MIN(CASE WHEN available=1 THEN retail_price ELSE NULL END) AS starting
    FROM topup_full_items WHERE version_id=?
    GROUP BY category_slug,category_name,category_short,accent
    ORDER BY CASE WHEN COALESCE(SUM(available),0)>0 THEN 0 ELSE 1 END,category_name`,
    args:[meta.id]});
  return rs.rows.map(x=>({slug:String(x.category_slug),name:String(x.category_name),
    short:String(x.category_short),accent:String(x.accent),total:Number(x.total),
    count:Number(x.count),fromPrice:x.starting===null?null:Number(x.starting),
    source:'game-feature' as const}));
}
export async function fullCategory(slug:string) {
  if(!fullCatalogPreviewEnabled())return null;
  const meta=await fullCatalogMeta();if(!meta)return null;
  const client=await db();
  const rs=await client.execute({sql:`SELECT category_name,category_short,accent
    FROM topup_full_items WHERE version_id=? AND category_slug=? LIMIT 1`,args:[meta.id,slug]});
  if(!rs.rows.length)return null;
  return {slug,name:String(rs.rows[0].category_name),short:String(rs.rows[0].category_short),
    accent:String(rs.rows[0].accent),capturedAt:meta.capturedAt};
}
export async function fullCategoryProducts(slug:string):Promise<FullCatalogItem[]>{
  const meta=await fullCatalogMeta();if(!meta)return [];
  const client=await db();
  const rs=await client.execute({sql:`SELECT row_index,supplier_sku,name,description,retail_price,
    available,needs_review,supplier_group FROM topup_full_items
    WHERE version_id=? AND category_slug=? ORDER BY available DESC,retail_price ASC,row_index ASC
    `,args:[meta.id,slug]});
  return rs.rows.map(x=>({id:Number(x.row_index),sku:String(x.supplier_sku),
    name:String(x.name),description:String(x.description),
    price:x.retail_price===null?null:Number(x.retail_price),
    available:Number(x.available)===1,review:Number(x.needs_review)===1,
    supplierGroup:String(x.supplier_group)}));
}
