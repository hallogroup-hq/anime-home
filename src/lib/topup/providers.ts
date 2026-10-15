import 'server-only';
import { createVipSignature, createTripayCreateSignature, createTripayCallbackSignature, constantTimeHexMatch } from './signatures';
import { GAMES, pricingForCost, visibleGame, type DigitalProduct } from './data';

type VIPAnswer<T> = { result: boolean; data?: T; message?: string };
type VIPItem = {
  code: string; game: string; name: string; description?: string;
  price: { basic?: number; premium?: number; special?: number };
  status?: string;
};
type VIPOrder = { trxid: string; status: string; note?: string; price?: number };

const VIP_BASE = 'https://vip-reseller.co.id/api/game-feature';

export function vipSignature() {
  const id = process.env.VIPAY_API_ID, key = process.env.VIPAY_API_KEY;
  if (!id || !key) throw new Error('VIPAY_NOT_CONFIGURED');
  return { key, sign: createVipSignature(id, key) };
}
export function vipWebhookSignature() {
  return vipSignature().sign;
}
export function safeEqualHex(candidate: string, expected: string) {
  return constantTimeHexMatch(candidate, expected);
}

async function vipCall<T>(params: Record<string, string>): Promise<VIPAnswer<T>> {
  const auth = vipSignature();
  const res = await fetch(VIP_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: new URLSearchParams({ ...auth, ...params }).toString(),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('VIPAY_HTTP_' + res.status);
  const data = await res.json() as VIPAnswer<T>;
  if (!data.result) throw new Error('VIPAY_REQUEST_REJECTED');
  return data;
}

type VIPProfile = { full_name?: string; username?: string; balance?: number; level?: string };

export async function vipProfile() {
  const auth = vipSignature();
  const response = await fetch('https://vip-reseller.co.id/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(auth).toString(),
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error('VIPAY_PROFILE_HTTP_' + response.status);
  const json = await response.json() as VIPAnswer<VIPProfile>;
  if (json.result !== true || !json.data || typeof json.data !== 'object') {
    const message = typeof json.message === 'string' ? json.message.toLowerCase() : '';
    const category = /white.?list|\bip\b|ip address|alamat ip/.test(message)
      ? 'IP_RESTRICTION'
      : /development|not live|belum aktif|tidak aktif|nonaktif|disabled|inactive/.test(message)
        ? 'API_NOT_ACTIVE'
        : /api.?key|signature|\bsign\b|kunci api|authorization|authentication|autentikasi/.test(message)
          ? 'AUTH_REJECTED'
          : 'UNKNOWN';
    throw new Error('VIPAY_PROFILE_REJECTED_' + category);
  }
  return {
    active: true,
    level: typeof json.data.level === 'string' ? json.data.level.slice(0, 30) : null,
    balanceConfigured: Number.isFinite(Number(json.data.balance)),
  };
}

const VIP_NICKNAME_CODES: Record<string, string> = {
  'mobile-legends': 'mobile-legends',
  'free-fire': 'free-fire',
  'pubg-mobile': 'pubgm',
  'valorant': 'valorant',
  'genshin-impact': 'genshin-impact',
  'honkai-star-rail': 'honkai-star-rail',
};

export async function vipGetNickname(gameSlug: string, target: string, zone: string) {
  const code = VIP_NICKNAME_CODES[gameSlug];
  if (!code) return { supported: false as const };
  if (!/^[a-zA-Z0-9._#-]{3,80}$/.test(target) || zone.length > 80 ||
      (['mobile-legends', 'genshin-impact', 'honkai-star-rail'].includes(gameSlug) && !zone)) {
    throw new Error('NICKNAME_TARGET_INVALID');
  }
  const response = await vipCall<string>({
    type: 'get-nickname', code, target, additional_target: zone,
  });
  if (typeof response.data !== 'string' || !response.data.trim()) {
    throw new Error('NICKNAME_NOT_FOUND');
  }
  return { supported: true as const, nickname: response.data.trim().slice(0, 80) };
}

// Raw supplier Game Feature catalog, for preview-only versioned backup.
// Do not reuse this unverified dataset for order fulfillment.
export async function vipAllGameServices():Promise<VIPItem[]> {
  const result=await vipCall<VIPItem[]>({type:'services'});
  if(!Array.isArray(result.data)) throw new Error('VIPAY_CATALOG_INVALID');
  return result.data;
}

export type VIPPrepaidItem = {
  brand?: string; type?: string; category?: string; prepost?: string;
  code?: string; name?: string; note?: string;
  price?: { basic?: number; premium?: number; special?: number };
  status?: string;
};

// VIP prepaid is a different provider namespace from game-feature.
// Only read the services directory; do not execute orders here.
export async function vipAllPrepaidServices():Promise<VIPPrepaidItem[]> {
  const auth=vipSignature();
  const response=await fetch('https://vip-reseller.co.id/api/prepaid',{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},
    body:new URLSearchParams({...auth,type:'services'}).toString(),
    cache:'no-store',
    signal:AbortSignal.timeout(18000)
  });
  if(!response.ok)throw new Error('VIP_PREPAID_HTTP_'+response.status);
  const payload=await response.json() as VIPAnswer<VIPPrepaidItem[]>;
  if(payload.result!==true||!Array.isArray(payload.data))throw new Error('VIP_PREPAID_LIST_REJECTED');
  return payload.data;
}

export async function vipCatalog() {
  const result = await vipCall<VIPItem[]>({ type: 'services' });
  if (!Array.isArray(result.data)) throw new Error('VIPAY_CATALOG_INVALID');
  const products: DigitalProduct[] = [];
  for (const entry of result.data) {
    if (!entry || typeof entry.code !== 'string' || entry.code.length > 100 ||
        typeof entry.game !== 'string' || typeof entry.name !== 'string') continue;
    const group = GAMES.find(game => game.match.test(entry.game));
    if (!group || !visibleGame(group.slug)) continue;
    // Exclude account access, account sales, joki, and other credential-dependent services.
    if (/joki|akun|account|login|password|boost|skin gift|gift skin/i.test(entry.game + ' ' + entry.name)) continue;
    const cost = Number(entry.price?.basic);
    if (!Number.isSafeInteger(cost) || cost < 100 || cost > 10_000_000) continue;
    const price = pricingForCost(cost);
    if (!price) continue;
    const description = (entry.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600);
    products.push({
      sku: entry.code, gameSlug: group.slug, gameName: group.name,
      name: entry.name.slice(0, 160), description,
      cost, price, available: entry.status === 'available',
    });
  }
  return products;
}

export async function vipCreateOrder(service: string, target: string, zone: string) {
  const response = await vipCall<VIPOrder>({
    type: 'order', service, data_no: target, ...(zone ? { data_zone: zone } : {}),
  });
  if (!response.data?.trxid) throw new Error('VIPAY_ORDER_NO_REFERENCE');
  return response.data;
}

export async function vipCheckOrder(trxid: string) {
  const response = await vipCall<VIPOrder[] | VIPOrder>({ type: 'status', trxid });
  const rows = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];
  const row = rows.find(item => String(item.trxid) === trxid);
  if (!row) throw new Error('VIPAY_ORDER_NOT_FOUND');
  return row;
}

export type TripayTransaction = {
  reference: string;
  merchant_ref: string;
  amount: number;
  total_amount?: number;
  fee_merchant?: number;
  fee_customer?: number;
  amount_received?: number;
  checkout_url?: string | null;
  qr_url?: string | null;
  pay_code?: string | null;
  status?: string;
};

export function tripayReady() {
  return Boolean(process.env.TRIPAY_API_KEY && process.env.TRIPAY_PRIVATE_KEY &&
    process.env.TRIPAY_MERCHANT_CODE && process.env.TOPUP_STORE_ENABLED === 'true');
}

function tripayCredentials() {
  if (!tripayReady()) throw new Error('TOPUP_PAYMENT_NOT_READY');
  return {
    apiKey: process.env.TRIPAY_API_KEY!,
    privateKey: process.env.TRIPAY_PRIVATE_KEY!,
    merchantCode: process.env.TRIPAY_MERCHANT_CODE!,
    root: process.env.TRIPAY_MODE === 'production' ? 'https://tripay.co.id/api' : 'https://tripay.co.id/api-sandbox',
  };
}

export async function tripayCreatePayment(input: {
  id: string; amount: number; name: string; email: string; productName: string;
}): Promise<TripayTransaction> {
  const c = tripayCredentials();
  const body = new URLSearchParams({
    method: 'QRIS',
    merchant_ref: input.id,
    amount: String(input.amount),
    customer_name: input.name,
    customer_email: input.email,
    'order_items[0][name]': input.productName,
    'order_items[0][price]': String(input.amount),
    'order_items[0][quantity]': '1',
    callback_url: (process.env.TOPUP_PUBLIC_ORIGIN || 'https://anime-home-psi.vercel.app') + '/api/topup/callback/tripay',
    return_url: (process.env.TOPUP_PUBLIC_ORIGIN || 'https://anime-home-psi.vercel.app') + '/topup/order/' + input.id,
    expired_time: String(Math.floor(Date.now() / 1000) + 30 * 60),
    signature: createTripayCreateSignature(c.merchantCode, input.id, input.amount, c.privateKey),
  });
  const res = await fetch(c.root + '/transaction/create', {
    method: 'POST', headers: {
      Authorization: 'Bearer ' + c.apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    }, body, cache: 'no-store', signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error('TRIPAY_HTTP_' + res.status);
  const parsed = await res.json();
  if (!parsed.success || !parsed.data || parsed.data.merchant_ref !== input.id ||
      !parsed.data.reference) throw new Error('TRIPAY_CREATE_REJECTED');
  return parsed.data as TripayTransaction;
}

export function validTripayCallback(rawBody: string, receivedSignature: string) {
  const key = process.env.TRIPAY_PRIVATE_KEY;
  if (!key) return false;
  const signature = createTripayCallbackSignature(rawBody, key);
  return safeEqualHex(receivedSignature, signature);
}

export async function tripayFetchPayment(reference: string): Promise<TripayTransaction & { status: string; is_closed_payment?: number }> {
  const c = tripayCredentials();
  if (!/^[A-Za-z0-9_-]{3,100}$/.test(reference)) throw new Error('TRIPAY_REFERENCE_INVALID');
  const res = await fetch(c.root + '/transaction/detail?reference=' + encodeURIComponent(reference), {
    headers: { Authorization: 'Bearer ' + c.apiKey, Accept: 'application/json' },
    cache: 'no-store', signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error('TRIPAY_LOOKUP_FAILED');
  const parsed = await res.json();
  if (!parsed.success || !parsed.data || parsed.data.reference !== reference) {
    throw new Error('TRIPAY_LOOKUP_INVALID');
  }
  return parsed.data;
}
