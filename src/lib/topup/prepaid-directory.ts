import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { getClient, pricingForCost } from './data';
import { vipAllPrepaidServices } from './providers';
import { fullCatalogPreviewEnabled, type FullCatalogCategory, type FullCatalogItem } from './full-directory';

type PrepaidMeta={id:string;capturedAt:string;total:number;available:number;categories:number};
const init:{promise?:Promise<void>}={};
async function db(){
  const c=getClient();
  if(!init.promise)init.promise=c.batch([
    `CREATE TABLE IF NOT EXISTS topup_prepaid_versions(
      id TEXT PRIMARY KEY,captured_at TEXT NOT NULL,total INTEGER NOT NULL,
      available INTEGER NOT NULL,categories INTEGER NOT NULL,status TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS topup_prepaid_items(
      version_id TEXT NOT NULL,row_index INTEGER NOT NULL,sku TEXT NOT NULL,
      category_slug TEXT NOT NULL,category_name TEXT NOT NULL,brand TEXT NOT NULL,
      product_type TEXT NOT NULL,name TEXT NOT NULL,description TEXT NOT NULL,
      cost INTEGER,price INTEGER,available INTEGER NOT NULL,review INTEGER NOT NULL,
      reason TEXT NOT NULL,PRIMARY KEY(version_id,row_index))`,
    'CREATE INDEX IF NOT EXISTS topup_prepaid_category ON topup_prepaid_items(version_id,category_slug,available,price)',
    `CREATE TABLE IF NOT EXISTS topup_prepaid_active(id TEXT PRIMARY KEY,version_id TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS topup_prepaid_refresh(id TEXT PRIMARY KEY,last_attempt TEXT NOT NULL)`,
    {sql:"INSERT OR IGNORE INTO topup_prepaid_refresh(id,last_attempt) VALUES('main','1970-01-01 00:00:00')",args:[]}
  ],'write').then(()=>undefined).catch(e=>{init.promise=undefined;throw e;});
  await init.promise;
  return c;
}
export async function prepaidMeta():Promise<PrepaidMeta|null>{
  const c=await db();
  const q=await c.execute(`SELECT v.id,v.captured_at,v.total,v.available,v.categories
    FROM topup_prepaid_active a JOIN topup_prepaid_versions v ON v.id=a.version_id
    WHERE a.id='active' AND v.status='ready' LIMIT 1`);
  if(!q.rows.length)return null;
  const r=q.rows[0];
  return {id:String(r.id),capturedAt:String(r.captured_at),total:Number(r.total),
    available:Number(r.available),categories:Number(r.categories)};
}
function categoryId(brand:string,type:string){
  const cleanBrand=brand.trim().replace(/\s+/g,' ').slice(0,80)||'Lainnya';
  const cleanType=type.trim().replace(/\s+/g,' ').slice(0,80)||'Lainnya';
  const text=cleanBrand+' · '+cleanType;
  const url=(cleanBrand+'-'+cleanType).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48).replace(/-+$/,'')||'produk';
  const hash=createHash('sha256').update(text.toLowerCase()).digest('hex').slice(0,9);
  return {slug:'prepaid-'+url+'-'+hash,name:text};
}
const unsafe=/\b(akun|account|password|login|joki|rental|sewa|social media)\b/i;
async function importPrepaid(){
  const raw=await vipAllPrepaidServices();
  if(raw.length<10)throw new Error('VIP_PREPAID_CATALOG_EMPTY');
  const items=raw.map((entry,index)=>{
    const sku=typeof entry.code==='string'?entry.code.trim().slice(0,150):'';
    const name=typeof entry.name==='string'?entry.name.trim().slice(0,200):'';
    const brand=typeof entry.brand==='string'?entry.brand.trim().slice(0,80):'';
    const type=typeof entry.type==='string'?entry.type.trim().slice(0,80):'';
    const category=categoryId(brand,type||String(entry.category||''));
    const input=Number(entry.price?.basic);
    const cost=Number.isSafeInteger(input)&&input>0&&input<=100_000_000?input:null;
    const price=cost===null?null:pricingForCost(cost);
    const description=(typeof entry.note==='string'?entry.note:'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,1200);
    const status=typeof entry.status==='string'?entry.status.toLowerCase():'unknown';
    return {index,sku,name,brand,type,category,cost,price,description,status};
  });
  const frequency=new Map<string,number>();
  for(const item of items)if(item.sku)frequency.set(item.sku,(frequency.get(item.sku)||0)+1);
  const classified=items.map(x=>{
    const reason=!x.sku||!x.name?'INCOMPLETE_SOURCE':
      (frequency.get(x.sku)||0)>1?'DUPLICATE_SKU':
      unsafe.test(x.name+' '+x.description)?'MANUAL_REVIEW':
      x.price===null?'INVALID_PRICE':
      x.status!=='available'?'UNAVAILABLE':'READY_FOR_CATALOG';
    return {...x,reason,available:reason==='READY_FOR_CATALOG'};
  });
  const categories=new Set(classified.map(x=>x.category.slug)).size;
  const available=classified.filter(x=>x.available).length;
  if(categories<1)throw new Error('VIP_PREPAID_NO_CATEGORIES');
  const c=await db(),id=randomUUID(),capturedAt=new Date().toISOString();
  await c.execute({sql:"INSERT INTO topup_prepaid_versions(id,captured_at,total,available,categories,status) VALUES(?,?,?,?,?,'importing')",
    args:[id,capturedAt,items.length,available,categories]});
  try{
    const statements:Array<{sql:string;args:(string|number|null)[]}>=[];
    for(let i=0;i<classified.length;i+=48){
      const part=classified.slice(i,i+48);
      statements.push({sql:`INSERT INTO topup_prepaid_items
        (version_id,row_index,sku,category_slug,category_name,brand,product_type,name,description,
          cost,price,available,review,reason)
        VALUES ${part.map(()=>'(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',')}`,
        args:part.flatMap(x=>[id,x.index,x.sku,x.category.slug,x.category.name,
          x.brand,x.type,x.name,x.description,x.cost,x.price,x.available?1:0,
          x.reason==='MANUAL_REVIEW'||x.reason==='DUPLICATE_SKU'?1:0,x.reason])});
    }
    for(let i=0;i<statements.length;i+=6)await c.batch(statements.slice(i,i+6),'write');
    const q=await c.execute({sql:`SELECT COUNT(*) AS total,COALESCE(SUM(available),0) AS available,
      COUNT(DISTINCT category_slug) AS categories FROM topup_prepaid_items WHERE version_id=?`,args:[id]});
    if(Number(q.rows[0]?.total)!==items.length||Number(q.rows[0]?.available)!==available||
      Number(q.rows[0]?.categories)!==categories)throw new Error('VIP_PREPAID_BACKUP_MISMATCH');
    await c.batch([
      {sql:"UPDATE topup_prepaid_versions SET status='ready' WHERE id=?",args:[id]},
      {sql:"INSERT INTO topup_prepaid_active(id,version_id) VALUES('active',?) ON CONFLICT(id) DO UPDATE SET version_id=excluded.version_id",args:[id]}
    ],'write');
  }catch{
    await c.execute({sql:"UPDATE topup_prepaid_versions SET status='failed' WHERE id=? AND status='importing'",args:[id]}).catch(()=>{});
    throw new Error('VIP_PREPAID_SAVE_FAILED');
  }
}
export async function ensurePrepaid(){
  if(!fullCatalogPreviewEnabled())return;
  const meta=await prepaidMeta();
  if(meta && Date.now()-Date.parse(meta.capturedAt)<24*3600_000)return;
  const c=await db();
  const claim=await c.execute({sql:`UPDATE topup_prepaid_refresh SET last_attempt=CURRENT_TIMESTAMP
    WHERE id='main' AND last_attempt<datetime('now','-5 minutes')`,args:[]});
  if(!claim.rowsAffected)return;
  try{await importPrepaid();}catch{
    // Keep previous database snapshot if the dynamic supplier IP is blocked.
  }
}
export async function prepaidCategories():Promise<FullCatalogCategory[]>{
  await ensurePrepaid();
  const meta=await prepaidMeta();if(!meta)return [];
  const c=await db();
  const q=await c.execute({sql:`SELECT category_slug,category_name,COUNT(*) AS total,
    COALESCE(SUM(available),0) AS count,MIN(CASE WHEN available=1 THEN price END) AS starting
    FROM topup_prepaid_items WHERE version_id=? GROUP BY category_slug,category_name
    ORDER BY CASE WHEN COALESCE(SUM(available),0)>0 THEN 0 ELSE 1 END,category_name`,args:[meta.id]});
  return q.rows.map(x=>({slug:String(x.category_slug),name:String(x.category_name),
    short:String(x.category_name).split(/[ \u00b7]+/).slice(0,2).map(t=>t[0]||'').join('').toUpperCase(),
    accent:'#7E9FA2',count:Number(x.count),total:Number(x.total),
    fromPrice:x.starting===null?null:Number(x.starting),source:'game-feature' as const}));
}
export async function prepaidCategory(slug:string){
  if(!fullCatalogPreviewEnabled())return null;
  const meta=await prepaidMeta();if(!meta)return null;
  const c=await db();
  const q=await c.execute({sql:'SELECT category_name FROM topup_prepaid_items WHERE version_id=? AND category_slug=? LIMIT 1',args:[meta.id,slug]});
  if(!q.rows.length)return null;
  const name=String(q.rows[0].category_name);
  return {slug,name,short:name.slice(0,2).toUpperCase(),accent:'#7E9FA2',capturedAt:meta.capturedAt};
}
export async function prepaidProducts(slug:string):Promise<FullCatalogItem[]>{
  const meta=await prepaidMeta();if(!meta)return [];
  const c=await db();
  const q=await c.execute({sql:`SELECT row_index,sku,name,description,price,available,review,category_name
    FROM topup_prepaid_items WHERE version_id=? AND category_slug=?
    ORDER BY available DESC,price ASC,row_index ASC`,args:[meta.id,slug]});
  return q.rows.map(x=>({id:Number(x.row_index),sku:String(x.sku),name:String(x.name),
    description:String(x.description),price:x.price===null?null:Number(x.price),
    available:Number(x.available)===1,review:Number(x.review)===1,
    supplierGroup:String(x.category_name)}));
}
