'use client';

import { useState } from 'react';
import { MerchItem } from '@/types';
import { X, Check, QrCode, ShoppingBag, ShieldCheck, Truck, MessageSquare, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface QuickCheckoutModalProps {
  item: MerchItem | null;
  onClose: () => void;
  onOpenChatWithMerch?: (item: MerchItem) => void;
}

export function QuickCheckoutModal({ item, onClose, onOpenChatWithMerch }: QuickCheckoutModalProps) {
  if (!item) return null;

  const [step, setStep] = useState<'form' | 'qris' | 'success'>('form');
  const [selectedVariant, setSelectedVariant] = useState<string>(
    item.variants && item.variants.length > 0 ? item.variants[0] : 'Standar'
  );
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderResult, setOrderResult] = useState<any>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleProceedToQRIS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerContact.trim() || !shippingAddress.trim() || !city.trim()) {
      setErrorMsg('Mohon lengkapi semua kolom nama, kontak, alamat, dan kota.');
      return;
    }
    setErrorMsg('');
    setStep('qris');
  };

  const handleConfirmPayment = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/merch/orders', {
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses pesanan');

      setOrderResult(data.order);
      setStep('success');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-wide uppercase">Anime Home Store</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-medium">
                  Official Merch
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Dropship Resmi atas nama Anime Home</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Product Mini Preview */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">{item.animeTitle}</span>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-black text-emerald-400">{formatRupiah(item.price)}</span>
                <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-white/5">
                  Gratis Ongkir Support
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          selectedVariant === v
                            ? 'bg-red-600 text-white border-red-500 shadow-sm'
                            : 'bg-zinc-900 text-zinc-300 border-white/10 hover:border-white/20'
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
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Nomor WhatsApp / HP (Untuk Cek Resi)</label>
                  <input
                    type="tel"
                    required
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
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
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
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
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 p-2 rounded-lg">
                  {errorMsg}
                </p>
              )}

              {/* Guarantees */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 py-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Garansi Pengiriman Aman</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
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
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>Tanya CS Live</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="w-full flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-red-600/20"
                >
                  <span>Lanjut Bayar QRIS ({formatRupiah(item.price)})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: DYNAMIC QRIS SCREEN */}
          {step === 'qris' && (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-white text-zinc-900 max-w-[260px] mx-auto shadow-xl space-y-2">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                  <span className="text-[11px] font-black tracking-wider text-red-600">QRIS NASIONAL</span>
                  <span className="text-[10px] font-bold text-zinc-500">GOPAY / BCA / DANA</span>
                </div>
                {/* Visual QR Code Generator Simulation */}
                <div className="relative aspect-square bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center p-3">
                  <QrCode className="w-full h-full text-zinc-900 stroke-[1.5]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      ANIME HOME
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-mono font-bold text-zinc-700">
                  NMID: ID102026AH789
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-white">Total Tagihan: {formatRupiah(item.price)}</div>
                <p className="text-[11px] text-zinc-400">
                  Scan QRIS di atas menggunakan GoPay, BCA Mobile, Livin, OVO, Dana, atau ShopeePay.
                </p>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 p-2 rounded-lg">
                  {errorMsg}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-4 py-2.5 rounded-xl border border-white/10 bg-zinc-900 text-zinc-300 text-xs font-medium hover:text-white"
                >
                  Ubah Alamat
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmPayment}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memverifikasi Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saya Sudah Bayar (Konfirmasi Lunas)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && orderResult && (
            <div className="text-center space-y-4 py-3">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pembayaran Berhasil Diverifikasi!</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Pesanan <span className="font-mono text-zinc-200">#{orderResult.id.slice(-6)}</span> telah tercatat dengan status <span className="text-emerald-400 font-bold">PAID</span>.
                </p>
              </div>

              <div className="bg-zinc-900/70 border border-white/[0.08] p-3.5 rounded-xl text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-zinc-400">Penerima:</span>
                  <span className="font-semibold text-white">{orderResult.customerName} ({orderResult.customerContact})</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-zinc-400">Tujuan:</span>
                  <span className="text-white text-right truncate max-w-[220px]">{orderResult.shippingAddress}, {orderResult.city}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-zinc-400">Pengirim:</span>
                  <span className="text-emerald-400 font-bold">Anime Home Store</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">No Resi Pelacakan:</span>
                  <span className="font-mono font-bold text-blue-400">{orderResult.trackingNumber}</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400">
                Pemberitahuan & tanda terima telah otomatis dikirimkan ke live chat sesi kamu.
              </p>

              <div className="flex items-center gap-2.5 pt-2">
                {onOpenChatWithMerch && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenChatWithMerch(item);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>Buka Chat Live Support</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer"
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
