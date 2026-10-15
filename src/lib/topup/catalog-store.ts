import 'server-only';
import { randomUUID } from 'node:crypto';
import { getClient, type PublicCatalogProduct } from './data';
import { vipCatalog } from './providers';

// Isolated supplier backup: never writes anime, merchandise or order tables.
let tablesPromise: Promise<void> | undefined;
async function catalogDb() {
  const db = getClient();
  if (!tablesPromise) {
    tablesPromise = db.batch([
      `CREATE TABLE IF NOT EXISTS topup_catalog_snapshots (
        id TEXT PRIMARY KEY, source TEXT NOT NULL, captured_at TEXT NOT NULL,
        total INTEGER NOT NULL, available INTEGER NOT NULL, status TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS topup_catalog_items (
        snapshot_id TEXT NOT NULL, sku TEXT NOT NULL, game_slug TEXT NOT NULL,
        game_name TEXT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL,
        supplier_cost INTEGER NOT NULL, retail_price INTEGER NOT NULL,
        available INTEGER NOT NULL, PRIMARY KEY (snapshot_id, sku)
      )`,
      'CREATE INDEX IF NOT EXISTS topup_catalog_items_game ON topup_catalog_items(snapshot_id,game_slug,available,retail_price)',
      `CREATE TABLE IF NOT EXISTS topup_catalog_active (
        id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS topup_catalog_refresh (
        id TEXT PRIMARY KEY, last_attempt TEXT NOT NULL
      )`,
      { sql:"INSERT OR IGNORE INTO topup_catalog_refresh(id,last_attempt) VALUES ('vip','1970-01-01 00:00:00')", args: [] },
    ], 'write').then(() => undefined).catch(err => { tablesPromise = undefined; throw err; });
  }
  await tablesPromise;
  return db;
}

export async function getLatestCatalogMeta() {
  const db = await catalogDb();
  const rs = await db.execute(`SELECT s.id,s.captured_at,s.total,s.available
    FROM topup_catalog_active a JOIN topup_catalog_snapshots s ON a.snapshot_id=s.id
    WHERE a.id='active' AND s.status='ready' LIMIT 1`);
  if (!rs.rows.length) return null;
  const item = rs.rows[0];
  return { id:String(item.id), capturedAt:String(item.captured_at),
    total:Number(item.total), available:Number(item.available) };
}

async function importCatalogVersion() {
  const db = await catalogDb();
  const products = await vipCatalog();
  if (products.length < 10 || !products.some(p=>p.available)) throw new Error('SUPPLIER_CATALOG_INVALID');
  const ids = new Set<string>();
  for (const p of products) {
    if (!p.sku || ids.has(p.sku) || !Number.isSafeInteger(p.cost) ||
        !Number.isSafeInteger(p.price) || p.price <= p.cost ||
        !p.name || !p.gameSlug || p.description.length > 600) {
      throw new Error('SUPPLIER_CATALOG_DUPLICATE_OR_INVALID');
    }
    ids.add(p.sku);
  }

  const snapshotId = randomUUID();
  const capturedAt = new Date().toISOString();
  const available = products.filter(p=>p.available).length;
  await db.execute({
    sql: "INSERT INTO topup_catalog_snapshots(id,source,captured_at,total,available,status) VALUES (?,?,?,?,?,'importing')",
    args:[snapshotId,'vipayment-game-feature',capturedAt,products.length,available],
  });

  const rowSize = 25; // 225 SQLite placeholders per INSERT; safely below standard limits.
  const sqlBatchSize = 8;
  try {
    const statements = [];
    for (let i=0; i<products.length; i+=rowSize) {
      const part = products.slice(i,i+rowSize);
      statements.push({
        sql: `INSERT INTO topup_catalog_items
          (snapshot_id,sku,game_slug,game_name,name,description,supplier_cost,retail_price,available)
          VALUES ${part.map(()=>'(?,?,?,?,?,?,?,?,?)').join(',')}`,
        args: part.flatMap(p=>[snapshotId,p.sku,p.gameSlug,p.gameName,p.name,
          p.description,p.cost,p.price,p.available?1:0]),
      });
    }
    for (let i=0;i<statements.length;i+=sqlBatchSize) {
      await db.batch(statements.slice(i,i+sqlBatchSize),'write');
    }
    const count = await db.execute({
      sql: 'SELECT COUNT(*) AS total,SUM(available) AS available FROM topup_catalog_items WHERE snapshot_id=?',
      args: [snapshotId],
    });
    if (Number(count.rows[0]?.total)!==products.length ||
        Number(count.rows[0]?.available)!==available) throw new Error('SUPPLIER_SNAPSHOT_COUNT_MISMATCH');
    await db.batch([
      { sql: "UPDATE topup_catalog_snapshots SET status='ready' WHERE id=?",args:[snapshotId] },
      { sql: "INSERT INTO topup_catalog_active(id,snapshot_id) VALUES ('active',?) ON CONFLICT(id) DO UPDATE SET snapshot_id=excluded.snapshot_id",args:[snapshotId] },
    ],'write');
    return { total:products.length, available, capturedAt };
  } catch {
    // Incomplete rows never become active. Do not delete previous good snapshots.
    await db.execute({sql:"UPDATE topup_catalog_snapshots SET status='failed' WHERE id=? AND status='importing'",args:[snapshotId]}).catch(()=>{});
    throw new Error('SUPPLIER_BACKUP_WRITE_FAILED');
  }
}

export async function ensureCatalogBackup() {
  if (process.env.VERCEL_ENV !== 'preview' ||
      process.env.VERCEL_GIT_COMMIT_REF !== 'feat/digital-topup-store-foundation-20261014' ||
      process.env.TOPUP_CATALOG_PREVIEW_ENABLED !== 'true' ||
      process.env.TOPUP_STORE_ENABLED === 'true') return;

  const current = await getLatestCatalogMeta();
  if (current && Date.now()-Date.parse(current.capturedAt) < 24*3600_000) return;

  const db = await catalogDb();
  const claimed = await db.execute({
    sql: `UPDATE topup_catalog_refresh SET last_attempt=CURRENT_TIMESTAMP
      WHERE id='vip' AND last_attempt < datetime('now','-1 minutes')`,
    args:[],
  });
  if (!claimed.rowsAffected) return;

  try { await importCatalogVersion(); }
  catch {
    // Supplier whitelist can change. Keep existing backup intact and retry later.
  }
}

export async function previewCatalogCounts() {
  await ensureCatalogBackup();
  const meta = await getLatestCatalogMeta();
  if (!meta) return [];
  const db = await catalogDb();
  const rs = await db.execute({
    sql: `SELECT game_slug AS slug,COUNT(*) AS count,MIN(retail_price) AS starting
      FROM topup_catalog_items WHERE snapshot_id=? AND available=1 GROUP BY game_slug`,
    args:[meta.id],
  });
  return rs.rows.map(row=>({slug:String(row.slug),count:Number(row.count),starting:Number(row.starting)}));
}

export async function previewCatalogForGame(slug:string):Promise<PublicCatalogProduct[]> {
  await ensureCatalogBackup();
  const meta = await getLatestCatalogMeta();
  if (!meta) return [];
  const db = await catalogDb();
  const rs = await db.execute({
    sql: `SELECT sku,game_slug,name,description,retail_price
      FROM topup_catalog_items WHERE snapshot_id=? AND game_slug=? AND available=1
      ORDER BY retail_price ASC,sku ASC LIMIT 2000`,
    args:[meta.id,slug],
  });
  return rs.rows.map(row=>({
    sku:String(row.sku),gameSlug:String(row.game_slug),name:String(row.name),
    description:String(row.description),price:Number(row.retail_price)
  }));
}
