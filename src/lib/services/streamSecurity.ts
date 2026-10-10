import crypto from 'crypto';

const STREAM_SECRET = process.env.STREAM_SECURITY_SECRET || 'anime-home-secure-stream-key-2026-xyz789';
const TICKET_EXPIRATION_MS = 4 * 60 * 60 * 1000; // 4 jam

export interface StreamTicketData {
  variantId: string;
  episodeId: string;
  quality?: string;
  expiresAt: number;
}

/**
 * Universal base64url encoder safe across Node.js, Vercel Serverless, and browser runtimes.
 * Prevents "TypeError: Unknown encoding: base64url" in client bundles.
 */
function toBase64Url(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  if (typeof btoa !== 'undefined') {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  return '';
}

/**
 * Universal base64url decoder safe across Node.js, Vercel Serverless, and browser runtimes.
 */
function fromBase64Url(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    return decodeURIComponent(
      Array.prototype.map.call(binary, (ch: string) => '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  }
  return '';
}

/**
 * Safe HMAC-SHA256 calculation that runs seamlessly in Node.js server and falls back safely in browser.
 */
function computeSignature(payload: string, secret: string): string {
  try {
    if (crypto && typeof crypto.createHmac === 'function') {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      return hmac.digest('hex').slice(0, 32);
    }
  } catch {}

  // Deterministic fallback for browser hydration contexts
  let h1 = 0xdeadbeef ^ secret.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  const full = secret + ':' + payload;
  for (let i = 0; i < full.length; i++) {
    const ch = full.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0') +
         (4294967296 * (2097151 & h1) + (h2 >>> 0)).toString(16).padStart(16, '0');
}

/**
 * Generate cryptographic signed ticket to hide raw stream URLs from client and scrapers.
 */
export function generateStreamTicket(params: {
  variantId: string;
  episodeId: string;
  quality?: string;
}): string {
  const expiresAt = Date.now() + TICKET_EXPIRATION_MS;
  const rawPayload = `${params.variantId}|${params.episodeId}|${params.quality || 'Auto'}|${expiresAt}`;
  const signature = computeSignature(rawPayload, STREAM_SECRET);
  const encodedPayload = toBase64Url(rawPayload);
  return `st_${encodedPayload}_${signature}`;
}

/**
 * Verify signed ticket and extract underlying stream references.
 */
export function verifyStreamTicket(ticket: string): {
  valid: boolean;
  data?: StreamTicketData;
  reason?: string;
} {
  if (!ticket || !ticket.startsWith('st_')) {
    return { valid: false, reason: 'Format tiket streaming tidak valid' };
  }

  const parts = ticket.slice(3).split('_');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Struktur tiket tidak lengkap' };
  }

  const [encodedPayload, providedSig] = parts;

  try {
    const rawPayload = fromBase64Url(encodedPayload);
    const [variantId, episodeId, quality, expiresStr] = rawPayload.split('|');
    const expiresAt = parseInt(expiresStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, reason: 'Tiket streaming telah kedaluwarsa' };
    }

    const expectedSig = computeSignature(rawPayload, STREAM_SECRET);
    if (providedSig !== expectedSig) {
      return { valid: false, reason: 'Tanda tangan kriptografis tidak cocok' };
    }

    return {
      valid: true,
      data: {
        variantId,
        episodeId,
        quality,
        expiresAt,
      },
    };
  } catch (err: any) {
    return { valid: false, reason: `Gagal memverifikasi tiket: ${err.message}` };
  }
}

/**
 * Brand-safe server names masking root source providers.
 * Completely conceals external hostnames like Mega, Vidhide, YouTube, Otakudesu.
 */
export function getMaskedServerName(index: number, quality?: string): string {
  const SERVER_NAMES = [
    `Server Alpha (High Speed ${quality || 'HD'})`,
    'Server Beta (Cadangan HD)',
    'Server Gamma (Multi-CDN)',
    'Server Delta (Fast Mirror)',
    'Server Epsilon (Direct CDN)',
  ];

  return SERVER_NAMES[index] || `Server ${index + 1} (${quality || 'HD'})`;
}

/**
 * Hostname allowlist for upstream media proxy to prevent SSRF and Open Proxy abuse.
 */
const ALLOWED_STREAM_HOSTS = [
  'mega.nz',
  'mega.io',
  'vidhideplus.com',
  'vidhide.com',
  'vidhidepro.com',
  'odvidhide.com',
  'desustream.net',
  'desustream.me',
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'blogger.com',
  's1.kotakanimeid.link',
  's2.kotakanimeid.link',
  'kotakanimeid.link',
  'nontonanimeid.boats',
  's13.nontonanimeid.boats',
  'gdplayer.to',
  's1.rpmvip.com',
];

export function isAllowedStreamHost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_STREAM_HOSTS.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}
