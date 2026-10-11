'use client';

import { useState, useEffect, useRef } from 'react';
import { MerchItem } from '@/types';
import { 
  X, Check, QrCode, ShoppingBag, ShieldCheck, Truck, MessageSquare, 
  ArrowRight, Loader2, Copy, Download, RefreshCw, AlertCircle, ExternalLink 
} from 'lucide-react';

interface QuickCheckoutModalProps {
  item: MerchItem | null;
  initialVariant?: string;
  onClose: () => void;
  onOpenChatWithMerch?: (item: MerchItem) => void;
}

interface QRISData {
  qris_id: string;
  trx_id: string;
  qris_code: string;
  qris_image_url: string;
  amount: number;
  merchant_name: string;
  nmid: string;
  city: string;
  postal_code?: string;
  expires_at: string;
}

export function QuickCheckoutModal({ 
  item, 
  initialVariant,
  onClose, 
  onOpenChatWithMerch 
}: QuickCheckoutModalProps) {
  if (!item) return null;

  const [step, setStep] = useState<'form' | 'qris' | 'success'>('form');
  const [selectedVariant, setSelectedVariant] = useState<string>(
    initialVariant || (item.variants && item.variants.length > 0 ? item.variants[0] : 'Standar')
  );
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderResult, setOrderResult] = useState<any>(null);
  const [qrisData, setQrisData] = useState<QRISData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 mins countdown

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Timer countdown when in QRIS screen
  useEffect(() => {
    if (step !== 'qris') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Real-time automatic polling status check every 6 seconds
  useEffect(() => {
    if (step !== 'qris' || !qrisData || !orderResult) return;

    const checkPaymentSilent = async () => {
      try {
        const query = new URLSearchParams({
          trx_id: qrisData.trx_id,
          order_id: orderResult.id,
          amount: String(qrisData.amount),
        });

        const res = await fetch(`/api/payment/status/${encodeURIComponent(qrisData.qris_id)}?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paid && data.order) {
            setOrderResult(data.order);
            setStep('success');
          }
        }
      } catch (err) {
        // Silent polling error handling
      }
    };

    pollingRef.current = setInterval(checkPaymentSilent, 6000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step, qrisData, orderResult]);

  // Step 1: Proceed to QRIS Generation
  const handleProceedToQRIS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerContact.trim() || !shippingAddress.trim() || !city.trim()) {
      setErrorMsg('Mohon lengkapi semua kolom nama, kontak WhatsApp, alamat, dan kota.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      // 1. Create real unpaid order first in database
      const orderRes = await fetch('/api/merch/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchId: item.id,
          merchName: item.name,
          merchImage: item.imageUrl,
          animeTitle: item.animeTitle,
          customerName,
          customerContact,
          shippingAddress,
          city,
          selectedVariant,
          quantity: 1,
          totalAmount: item.price,
          costAmount: item.costPrice || Math.round(item.price * 0.5),
          profitAmount: item.price - (item.costPrice || Math.round(item.price * 0.5)),
          paymentStatus: 'unpaid',
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.order) {
        throw new Error(orderData.error || 'Gagal menyimpan pesanan.');
      }

      setOrderResult(orderData.order);

      // 2. Request GoPay Merchant Dynamic QRIS
      const qrisRes = await fetch('/api/payment/create-qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: item.price,
          orderId: orderData.order.id,
          customerName,
        }),
      });

      const qrisJson = await qrisRes.json();
      if (!qrisRes.ok || !qrisJson.success || !qrisJson.data) {
        throw new Error(qrisJson.error || 'Gagal membuat QRIS GoPay Merchant.');
      }

      setQrisData(qrisJson.data);
      setTimeLeft(15 * 60);
      setStep('qris');
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Manual check mutation / payment status
  const handleCheckPaymentStatus = async () => {
    if (!qrisData || !orderResult) return;
    setVerifying(true);
    setErrorMsg('');

    try {
      const query = new URLSearchParams({
        trx_id: qrisData.trx_id,
        order_id: orderResult.id,
        amount: String(qrisData.amount),
      });

      const res = await fetch(`/api/payment/status/${encodeURIComponent(qrisData.qris_id)}?${query.toString()}`);
      const data = await res.json();

      if (data.paid && data.order) {
        setOrderResult(data.order);
        setStep('success');
      } else {
        setErrorMsg('Pembayaran belum terdeteksi di mutasi GoPay. Jika baru saja transfer, mohon tunggu beberapa saat lalu cek kembali, atau klik konfirmasi bantuan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memeriksa status pembayaran.');
    } finally {
      setVerifying(false);
    }
  };

  // Manual confirmation trigger (if customer already transferred via static or m-banking)
  const handleForceConfirmPayment = async () => {
    if (!qrisData || !orderResult) return;
    setVerifying(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/payment/status/${encodeURIComponent(qrisData.qris_id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderResult.id,
          trxId: qrisData.trx_id,
          amount: qrisData.amount,
          manualConfirmed: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.paid && data.order) {
        setOrderResult(data.order);
        setStep('success');
      } else {
        throw new Error(data.message || 'Gagal mengonfirmasi pembayaran.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengonfirmasi pembayaran.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyQRIS = () => {
    if (!qrisData?.qris_code) return;
    navigator.clipboard.writeText(qrisData.qris_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const merchantName = qrisData?.merchant_name || 'CV Kreativitas Anak Bangsa';
  const nmid = qrisData?.nmid || 'ID1026582958595';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-wide uppercase">Anime Home Store</span>
              <p className="text-[11px] text-zinc-400">Pengiriman atas nama Anime Home Store</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Product Mini Preview */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="w-16 h-16 rounded-lg object-cover border border-zinc-800 shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{item.animeTitle}</span>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-white">{formatRupiah(item.price)}</span>
                <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  Varian: {selectedVariant}
                </span>
              </div>
            </div>
          </div>

          {/* STEP 1: FORM PENGIRIMAN */}
          {step === 'form' && (
            <form onSubmit={handleProceedToQRIS} className="space-y-4">
              {/* Variant Selector */}
              {item.variants && item.variants.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Pilih Varian / Ukuran:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {item.variants.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                          selectedVariant === v
                            ? 'bg-white text-zinc-950 border-white'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Customer Form */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Nama Lengkap Penerima</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Dimas Aditya"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Nomor WhatsApp / HP (Untuk Konfirmasi & Resi Pengiriman)</label>
                  <input
                    type="tel"
                    required
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Kota / Kabupaten</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Contoh: Bandung"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Alamat Lengkap</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Nama jalan, RT/RW, No. rumah"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 border border-red-800/50 p-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Guarantees */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 py-2 border-t border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Garansi Pengiriman Aman</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Pengirim: Anime Home Store</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                {onOpenChatWithMerch && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenChatWithMerch(item);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Tanya CS</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-red-950/30 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyiapkan QRIS GoPay...</span>
                    </>
                  ) : (
                    <>
                      <span>Lanjut Pembayaran QRIS ({formatRupiah(item.price)})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: DYNAMIC QRIS SCREEN */}
          {step === 'qris' && qrisData && (
            <div className="space-y-4 text-center">
              {/* QR Code Container */}
              <div className="p-4 rounded-2xl bg-white text-zinc-900 max-w-[280px] mx-auto shadow-2xl space-y-2 border border-zinc-200">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                  <div className="text-left">
                    <span className="text-[11px] font-bold tracking-wider text-zinc-900 block">QRIS</span>
                    <span className="text-[10px] text-zinc-600 block">{merchantName}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-medium">GoPay</span>
                </div>

                {/* Real Dynamic QR Image */}
                <div className="relative aspect-square bg-white rounded-lg flex items-center justify-center p-1 border border-zinc-100">
                  <img 
                    src={qrisData.qris_image_url} 
                    alt={`QRIS GoPay - ${merchantName}`}
                    className="w-full h-full object-contain" 
                  />
                </div>

                <div className="space-y-0.5 pt-1 border-t border-zinc-100 text-left">
                  <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono">
                    <span>NMID:</span>
                    <span className="font-bold text-zinc-900">{nmid}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-600">
                    <span>Kota:</span>
                    <span className="font-medium text-zinc-800">{qrisData.city || 'SUKABUMI'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-600">
                    <span>Batas Bayar:</span>
                    <span className="font-bold text-red-600">{formatTimer(timeLeft)}</span>
                  </div>
                </div>
              </div>

              {/* Tagihan & Instruksi */}
              <div className="space-y-1">
                <div className="text-base font-bold text-white">
                  Nominal: <span className="text-red-400">{formatRupiah(qrisData.amount)}</span>
                </div>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Scan QRIS di atas dengan aplikasi apa saja: <strong className="text-zinc-200">GoPay, BCA Mobile, Livin by Mandiri, OVO, Dana, ShopeePay</strong>, atau m-Banking lainnya.
                </p>
              </div>

              {/* Helper Buttons: Copy & Download */}
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyQRIS}
                  className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedCode ? 'Disalin!' : 'Salin Kode QRIS'}</span>
                </button>
                <a
                  href={qrisData.qris_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="qris-anime-home.png"
                  className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Unduh Gambar QR</span>
                </a>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/50 p-2.5 rounded-lg text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs font-medium hover:text-white cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={verifying}
                  onClick={handleCheckPaymentStatus}
                  className="w-full flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-950/30 disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengecek Mutasi GoPay...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Cek Status Mutasi GoPay</span>
                    </>
                  )}
                </button>
              </div>

              {/* Fallback button for instant confirmation */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleForceConfirmPayment}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Sudah transfer tapi belum terdeteksi? Klik untuk Konfirmasi Mandiri
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && orderResult && (
            <div className="text-center space-y-4 py-3 animate-in zoom-in-95 duration-200">
              <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 text-white rounded-full flex items-center justify-center mx-auto">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pembayaran Berhasil</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Pesanan <span className="font-mono text-zinc-200 font-semibold">#{orderResult.id.slice(-6)}</span> telah terkonfirmasi lunas.
                </p>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-400">Penerima:</span>
                  <span className="font-semibold text-white">{orderResult.customerName} ({orderResult.customerContact})</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-400">Tujuan:</span>
                  <span className="text-white text-right truncate max-w-[220px]">{orderResult.shippingAddress}, {orderResult.city}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-400">Merchant Penerima:</span>
                  <span className="text-zinc-200 font-medium">{merchantName}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-400">Pengirim (Resi):</span>
                  <span className="text-white font-semibold">Anime Home Store</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">No. Resi Pelacakan:</span>
                  <span className="font-mono font-bold text-zinc-200">{orderResult.trackingNumber}</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400">
                Tanda terima resmi & update resi telah otomatis dikirimkan ke live chat CS.
              </p>

              <div className="flex items-center gap-2.5 pt-2">
                {onOpenChatWithMerch && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenChatWithMerch(item);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Buka Chat CS</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
