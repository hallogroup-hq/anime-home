import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export function createVipSignature(apiId: string, apiKey: string): string {
  return createHash('md5').update(apiId + apiKey).digest('hex');
}

export function createTripayCreateSignature(merchantCode: string, merchantRef: string, amount: number, privateKey: string): string {
  return createHmac('sha256', privateKey).update(merchantCode + merchantRef + amount).digest('hex');
}

export function createTripayCallbackSignature(body: string, privateKey: string): string {
  return createHmac('sha256', privateKey).update(body).digest('hex');
}

export function constantTimeHexMatch(received: string, expected: string): boolean {
  if (!/^[0-9a-f]+$/i.test(received) || received.length !== expected.length || received.length % 2 !== 0) return false;
  return timingSafeEqual(Buffer.from(received.toLowerCase(), 'hex'), Buffer.from(expected.toLowerCase(), 'hex'));
}
