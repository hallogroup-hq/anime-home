// GoPay Merchant Gateway Client & QRIS Utility
// Adapted from Singgah & Cherry Edu (https://github.com/ahmadzakiyox/gopay-api-gateaway)
// Merchant: CV Kreativitas Anak Bangsa (Sukabumi) - GoPay Merchant ID: G268795309

export const GOPAY_MERCHANT_INFO = {
  merchantName: 'CV Kreativitas Anak Bangsa',
  gopayMerchantId: 'G268795309',
  nmid: 'ID1026582958595',
  city: 'SUKABUMI',
  postalCode: '43112',
};

// Fallback static QRIS string template (EMVCo) for CV Kreativitas Anak Bangsa (GoPay Merchant G268795309)
export const DEFAULT_FALLBACK_STATIC_QRIS = 
  "00020101021126610014COM.GO-JEK.WWW01189360091432687953090210G2687953090303UMI51440014ID.CO.QRIS.WWW0215ID10265829585950303UMI5204899953033605802ID5925CV Kreativitas Anak Bangs6008SUKABUMI61054311262140703A01110362163042D87";

/**
 * Calculate CRC16-CCITT checksum for EMVCo QRIS payload
 */
export function calculateCRC16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Generate a dynamic QRIS string compliant with EMVCo specifications
 * directly from a static merchant QRIS template.
 */
export function generateLocalDynamicQRIS(amount: number, staticQRIS?: string): string {
  const base = (staticQRIS || process.env.QRIS_STATIC || DEFAULT_FALLBACK_STATIC_QRIS).trim();
  let payload = base;

  const idx63 = payload.indexOf('6304');
  if (idx63 !== -1) {
    payload = payload.substring(0, idx63);
  }

  const tags: { tag: string; val: string }[] = [];
  let i = 0;
  try {
    while (i < payload.length) {
      const tag = payload.substring(i, i + 2);
      const length = parseInt(payload.substring(i + 2, i + 4), 10);
      if (isNaN(length)) break;
      const val = payload.substring(i + 4, i + 4 + length);
      tags.push({ tag, val });
      i += 4 + length;
    }
  } catch (e) {
    console.error('Failed to parse static QRIS TLV tags', e);
  }

  const amountStr = Math.round(amount).toString();
  const newTags: { tag: string; val: string }[] = [];
  let hasTag54 = false;

  for (const item of tags) {
    if (item.tag === '01') {
      newTags.push({ tag: '01', val: '12' }); // 12 = Dynamic QR
    } else if (item.tag === '54') {
      newTags.push({ tag: '54', val: amountStr });
      hasTag54 = true;
    } else if (item.tag === '58' && !hasTag54) {
      newTags.push({ tag: '54', val: amountStr });
      hasTag54 = true;
      newTags.push(item);
    } else {
      newTags.push(item);
    }
  }

  if (!hasTag54) {
    newTags.push({ tag: '54', val: amountStr });
  }

  let result = '';
  for (const item of newTags) {
    const lenStr = item.val.length.toString().padStart(2, '0');
    result += `${item.tag}${lenStr}${item.val}`;
  }

  result += '6304';
  const checksum = calculateCRC16(result);
  return result + checksum;
}

export interface CreateQRISResult {
  success: boolean;
  qris_id: string;
  trx_id: string;
  qris_code: string;
  qris_image_url: string;
  amount: number;
  merchant_name: string;
  nmid: string;
  expires_at: string;
  is_simulator: boolean;
  message?: string;
}

/**
 * Creates a Dynamic QRIS for GoPay Merchant.
 * Calls external GoPay Gateway wrapper (/v1/qris) or upstream (/create-qris).
 * Otherwise, generates an authentic local EMVCo QRIS.
 */
export async function requestDynamicQRIS(
  amount: number, 
  metadata?: { orderId?: string; customerName?: string }
): Promise<CreateQRISResult> {
  const gatewayUrl = process.env.GOPAY_GATEWAY_URL || 'https://singgah-gopay-gateway-production.up.railway.app';
  const apiKey = process.env.GOPAY_GATEWAY_API_KEY?.trim();

  if (gatewayUrl && apiKey) {
    const cleanUrl = gatewayUrl.replace(/\/$/, '');

    // 1. Try Singgah Gateway Wrapper (/v1/qris)
    try {
      const res = await fetch(`${cleanUrl}/v1/qris`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ amount, order_id: metadata?.orderId }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const qCode = json.data.qris_code;
          return {
            success: true,
            qris_id: json.data.qris_id || `qris_${Date.now()}`,
            trx_id: json.data.trx_id || `TRX-${Date.now()}`,
            qris_code: qCode,
            qris_image_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qCode)}`,
            amount: json.data.amount || amount,
            merchant_name: GOPAY_MERCHANT_INFO.merchantName,
            nmid: GOPAY_MERCHANT_INFO.nmid,
            expires_at: json.data.expires_at || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            is_simulator: false,
          };
        }
      }
    } catch (err) {
      // Gateway error fallback
    }

    // 2. Try upstream /create-qris
    try {
      const res = await fetch(`${cleanUrl}/create-qris`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ amount, order_id: metadata?.orderId }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const qCode = json.data.qris_code;
          return {
            success: true,
            qris_id: json.data.qris_id || `qris_${Date.now()}`,
            trx_id: json.data.trx_id || `TRX-${Date.now()}`,
            qris_code: qCode,
            qris_image_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qCode)}`,
            amount: json.data.amount || amount,
            merchant_name: GOPAY_MERCHANT_INFO.merchantName,
            nmid: GOPAY_MERCHANT_INFO.nmid,
            expires_at: json.data.expires_at || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            is_simulator: false,
          };
        }
      }
    } catch (err) {
      // Fallback to local EMVCo generation
    }
  }

  // Built-in Dynamic EMVCo QRIS Generation for CV Kreativitas Anak Bangsa
  const dynamicCode = generateLocalDynamicQRIS(amount);
  const qrisId = 'qris_' + Math.random().toString(36).substring(2, 10);
  const trxId = 'TRX-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes window

  return {
    success: true,
    qris_id: qrisId,
    trx_id: trxId,
    qris_code: dynamicCode,
    qris_image_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(dynamicCode)}`,
    amount,
    merchant_name: GOPAY_MERCHANT_INFO.merchantName,
    nmid: GOPAY_MERCHANT_INFO.nmid,
    expires_at: expiresAt,
    is_simulator: false,
  };
}

/**
 * Checks payment status from the GoPay Gateway (/v1/payments/check or upstream /check-payment).
 */
export async function verifyQRISStatus(
  qrisId: string,
  trxId?: string,
  amount?: number,
  startTime?: string
): Promise<{ success: boolean; paid: boolean; status: string; transaction?: any }> {
  const gatewayUrl = process.env.GOPAY_GATEWAY_URL || 'https://singgah-gopay-gateway-production.up.railway.app';
  const apiKey = process.env.GOPAY_GATEWAY_API_KEY?.trim();

  if (gatewayUrl && apiKey) {
    const cleanUrl = gatewayUrl.replace(/\/$/, '');
    const queryStartTime = startTime
      ? new Date(startTime).toISOString()
      : new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // 1. Try Singgah Gateway Wrapper (/v1/payments/check)
    if (amount && trxId) {
      try {
        const res = await fetch(`${cleanUrl}/v1/payments/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            amount,
            startTime: queryStartTime,
            trxId,
            reference: qrisId,
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            return {
              success: true,
              paid: Boolean(json.paid),
              status: json.paid ? 'PAID' : 'PENDING',
              transaction: json.transaction,
            };
          }
        }
      } catch (err) {
        // Fallback
      }
    }

    // 2. Try upstream /check-payment
    if (amount && trxId) {
      try {
        const res = await fetch(`${cleanUrl}/check-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            amount,
            startTime: queryStartTime,
            trx_id: trxId,
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            return {
              success: true,
              paid: Boolean(json.paid),
              status: json.paid ? 'PAID' : 'PENDING',
              transaction: json.transaction,
            };
          }
        }
      } catch (err) {
        // Fallback
      }
    }

    // 3. Try /api/qr-status/:id
    if (!qrisId.startsWith('qris_')) {
      try {
        const res = await fetch(`${cleanUrl}/api/qr-status/${qrisId}`, {
          headers: { 'x-api-key': apiKey },
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const json = await res.json();
          return {
            success: json.success,
            paid: Boolean(json.paid),
            status: json.status || (json.paid ? 'PAID' : 'PENDING'),
            transaction: json.transaction,
          };
        }
      } catch (err) {
        // Fallback
      }
    }
  }

  return {
    success: true,
    paid: false,
    status: 'PENDING',
  };
}
