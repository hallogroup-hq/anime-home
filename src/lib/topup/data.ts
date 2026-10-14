import 'server-only';
import { createClient, type Client, type Row } from '@libsql/client';

export type GameConfig = {
  slug: string;
  name: string;
  short: string;
  match: RegExp;
  targetLabel: string;
  targetHint: string;
  requiresZone: boolean;
  zoneLabel?: string;
  accent: string;
};

export const GAMES: GameConfig[] = [
  { slug: 'mobile-legends', name: 'Mobile Legends', short: 'ML', match: /mobile legends/i, targetLabel: 'User ID', targetHint: 'Masukkan User ID pada profil game.', requiresZone: true, zoneLabel: 'Zone ID', accent: '#536FF6' },
  { slug: 'free-fire', name: 'Free Fire', short: 'FF', match: /free fire/i, targetLabel: 'Player ID', targetHint: 'Masukkan Player ID akun Free Fire.', requiresZone: false, accent: '#EA7135' },
  { slug: 'pubg-mobile', name: 'PUBG Mobile', short: 'PUBG', match: /pubg mobile/i, targetLabel: 'Character ID', targetHint: 'Gunakan Character ID dalam game.', requiresZone: false, accent: '#D19D59' },
  { slug: 'honor-of-kings', name: 'Honor of Kings', short: 'HOK', match: /honor of kings/i, targetLabel: 'Player ID', targetHint: 'Masukkan ID pemain yang benar.', requiresZone: false, accent: '#DBBB84' },
  { slug: 'genshin-impact', name: 'Genshin Impact', short: 'GI', match: /genshin impact/i, targetLabel: 'UID', targetHint: 'Masukkan UID akun.', requiresZone: true, zoneLabel: 'Server / Region', accent: '#8E8BCB' },
  { slug: 'honkai-star-rail', name: 'Honkai: Star Rail', short: 'HSR', match: /honkai.*star rail/i, targetLabel: 'UID', targetHint: 'Masukkan UID akun.', requiresZone: true, zoneLabel: 'Server / Region', accent: '#927FDE' },
  { slug: 'zenless-zone-zero', name: 'Zenless Zone Zero', short: 'ZZZ', match: /zenless zone zero/i, targetLabel: 'User ID', targetHint: 'Masukkan User ID akun.', requiresZone: true, zoneLabel: 'Server / Region', accent: '#D69D64' },
  { slug: 'wuthering-waves', name: 'Wuthering Waves', short: 'WW', match: /wuthering waves/i, targetLabel: 'UID', targetHint: 'Masukkan UID akun.', requiresZone: true, zoneLabel: 'Server / Region', accent: '#69AFB9' },
  { slug: 'roblox', name: 'Roblox', short: 'RBLX', match: /roblox/i, targetLabel: 'User ID', targetHint: 'Pastikan tipe produk dan target sesuai instruksi supplier.', requiresZone: false, accent: '#9A9EB1' },
  { slug: 'valorant', name: 'Valorant', short: 'VAL', match: /valorant/i, targetLabel: 'Riot ID', targetHint: 'Masukkan Riot ID sesuai instruksi layanan.', requiresZone: false, accent: '#FD5D64' },
];

export type DigitalProduct = {
  sku: string;
  gameSlug: string;
  gameName: string;
  name: string;
  description: string;
  cost: number;
  price: number;
  available: boolean;
};

export type TopupOrder = {
  id: string;
  sku: string;
  game_slug: string;
  product_name: string;
  email: string;
  customer_name: string;
  target_id: string;
  zone_id: string;
  amount: number;
  cost: number;
  payable_amount: number;
  token_hash: string;
  state: string;
  payment_reference: string | null;
  checkout_url: string | null;
  pay_code: string | null;
  qr_url: string | null;
  vendor_trx_id: string | null;
  delivery_note: string | null;
  created_at: string;
};

let client: Client | undefined;
let migration: Promise<void> | undefined;

export function getClient() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('TOPUP_STORAGE_NOT_CONFIGURED');
  }
  if (!client) client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  return client;
}

export async function topupDb(): Promise<Client> {
  const db = getClient();
  if (!migration) {
    migration = (async () => {
      // Only new, isolated tables; does not modify anime, merchandise or existing payments.
      await db.batch([
        \`CREATE TABLE IF NOT EXISTS topup_products (
          sku TEXT PRIMARY KEY, game_slug TEXT NOT NULL, game_name TEXT NOT NULL,
          name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', cost INTEGER NOT NULL,
          price INTEGER NOT NULL, available INTEGER NOT NULL DEFAULT 0,
          synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )\`,
        \`CREATE INDEX IF NOT EXISTS topup_products_game_idx ON topup_products(game_slug, available)\`,
        \`CREATE TABLE IF NOT EXISTS topup_orders (
          id TEXT PRIMARY KEY, sku TEXT NOT NULL, game_slug TEXT NOT NULL,
          product_name TEXT NOT NULL, email TEXT NOT NULL, customer_name TEXT NOT NULL,
          target_id TEXT NOT NULL, zone_id TEXT NOT NULL DEFAULT '',
          amount INTEGER NOT NULL, cost INTEGER NOT NULL, payable_amount INTEGER NOT NULL,
          token_hash TEXT NOT NULL, state TEXT NOT NULL,
          payment_reference TEXT UNIQUE, checkout_url TEXT, pay_code TEXT, qr_url TEXT,
          vendor_trx_id TEXT UNIQUE, delivery_note TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )\`,
        \`CREATE INDEX IF NOT EXISTS topup_orders_state_idx ON topup_orders(state, created_at)\`,
        \`CREATE INDEX IF NOT EXISTS topup_orders_vendor_idx ON topup_orders(vendor_trx_id)\`
      ], 'write');
    })().catch((error) => { migration = undefined; throw error; });
  }
  await migration;
  return db;
}

function number(value: unknown) { return Number(value || 0); }

export function formatProduct(row: Row): DigitalProduct {
  return {
    sku: String(row.sku), gameSlug: String(row.game_slug), gameName: String(row.game_name),
    name: String(row.name), description: String(row.description || ''),
    cost: number(row.cost), price: number(row.price), available: number(row.available) === 1,
  };
}

export async function productsForGame(slug: string) {
  const db = await topupDb();
  const result = await db.execute({ sql: 'SELECT * FROM topup_products WHERE game_slug = ? AND available = 1 ORDER BY price ASC LIMIT 200', args: [slug] });
  return result.rows.map(formatProduct);
}

export async function listGamesWithCounts() {
  const db = await topupDb();
  const rs = await db.execute('SELECT game_slug, COUNT(*) AS count, MIN(price) AS starting FROM topup_products WHERE available = 1 GROUP BY game_slug');
  return rs.rows.map(row => ({ slug: String(row.game_slug), count: number(row.count), starting: number(row.starting) }));
}

export async function productBySku(sku: string) {
  const db = await topupDb();
  const rs = await db.execute({ sql: 'SELECT * FROM topup_products WHERE sku = ? AND available = 1', args: [sku] });
  return rs.rows[0] ? formatProduct(rs.rows[0]) : null;
}

export async function getOrder(id: string): Promise<TopupOrder | null> {
  const db = await topupDb();
  const rs = await db.execute({ sql: 'SELECT * FROM topup_orders WHERE id = ?', args: [id] });
  return rs.rows[0] ? (rs.rows[0] as unknown as TopupOrder) : null;
}

export const gameConfig = (slug: string) => GAMES.find(game => game.slug === slug);
export const visibleGame = (slug: string) => {
  const permitted = (process.env.TOPUP_ALLOWED_GAMES || GAMES.map(g => g.slug).join(',')).split(',').map(v => v.trim());
  return permitted.includes(slug);
};

export function pricingForCost(cost: number) {
  const percent = Math.min(50, Math.max(0, Number(process.env.TOPUP_MARKUP_PERCENT || '8')));
  const flat = Math.max(0, Number(process.env.TOPUP_MARKUP_FIXED || '1200'));
  const price = Math.ceil((cost * (1 + percent / 100) + flat) / 100) * 100;
  return Number.isSafeInteger(price) && price > cost ? price : null;
}
