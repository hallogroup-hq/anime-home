import { NextRequest } from 'next/server';

interface RateLimitRecord {
  timestamps: number[];
  lastCleaned: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const CLEANUP_INTERVAL_MS = 1000 * 60 * 5; // 5 minutes
let lastGlobalCleanup = Date.now();

function cleanupStaleRecords(now: number, windowMs: number) {
  if (now - lastGlobalCleanup < CLEANUP_INTERVAL_MS && rateLimitStore.size < 2000) {
    return;
  }
  lastGlobalCleanup = now;
  rateLimitStore.forEach((record, key) => {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (validTimestamps.length === 0) {
      rateLimitStore.delete(key);
    } else {
      record.timestamps = validTimestamps;
      record.lastCleaned = now;
    }
  });
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  cleanupStaleRecords(now, windowMs);

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [], lastCleaned: now };
    rateLimitStore.set(key, record);
  }

  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  const oldestTimestamp = record.timestamps[0] || now;
  const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));

  if (record.timestamps.length >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  record.timestamps.push(now);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - record.timestamps.length),
    resetSeconds,
  };
}

export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first && /^[a-fA-F0-9:.]+$/.test(first)) {
      return first;
    }
  }

  const realIp = headers.get('x-real-ip');
  if (realIp && /^[a-fA-F0-9:.]+$/.test(realIp.trim())) {
    return realIp.trim();
  }

  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && /^[a-fA-F0-9:.]+$/.test(cfIp.trim())) {
    return cfIp.trim();
  }

  return '127.0.0.1';
}

const TRUSTED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'anime-home-psi.vercel.app',
]);

export function isAllowedOrigin(req: NextRequest | Request): boolean {
  const secFetchSite = req.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return false;
  }

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const checkUrl = origin || referer;

  if (!checkUrl) {
    return true;
  }

  try {
    const parsed = new URL(checkUrl);
    const host = parsed.hostname.toLowerCase();

    if (TRUSTED_HOSTS.has(host)) {
      return true;
    }

    if (host.endsWith('.vercel.app')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
