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
 * Generate cryptographic signed ticket to hide raw stream URLs from client and scrapers.
 */
export function generateStreamTicket(params: {
  variantId: string;
  episodeId: string;
  quality?: string;
}): string {
  const expiresAt = Date.now() + TICKET_EXPIRATION_MS;
  const rawPayload = `${params.variantId}|${params.episodeId}|${params.quality || 'Auto'}|${expiresAt}`;

  const hmac = crypto.createHmac('sha256', STREAM_SECRET);
  hmac.update(rawPayload);
  const signature = hmac.digest('hex').slice(0, 32);

  const encodedPayload = Buffer.from(rawPayload).toString('base64url');
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
    const rawPayload = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const [variantId, episodeId, quality, expiresStr] = rawPayload.split('|');
    const expiresAt = parseInt(expiresStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, reason: 'Tiket streaming telah kedaluwarsa' };
    }

    const hmac = crypto.createHmac('sha256', STREAM_SECRET);
    hmac.update(rawPayload);
    const expectedSig = hmac.digest('hex').slice(0, 32);

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
