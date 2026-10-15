'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock3, Copy, ExternalLink, ReceiptText, RotateCw, ShieldCheck } from 'lucide-react';

type Receipt = {
  id: string; product: string; gameSlug: string; amount: number; payableAmount: number;
  state: string; target: string; zone: string; checkoutUrl: string | null;
  qrUrl: string | null; payCode: string | null; note: string | null; createdAt: string;
};

const stateLabels: Record<string, { name: string; detail: string }> = {
  PAYMENT_CREATING: { name: 'Menyiapkan pembayaran', detail: 'Pembayaran sedang dibuat.' },
  AWAITING_PAYMENT: { name: 'Menunggu pembayaran', detail: 'Selesaikan pembayaran melalui halaman aman TriPay.' },
  PAYMENT_CONFIRMED: { name: 'Pembayaran terkonfirmasi', detail: 'Pesanan akan diteruskan ke supplier.' },
  FULFILLING: { name: 'Memproses top up', detail: 'Permintaan sedang dikirim ke supplier.' },
  PROCESSING: { name: 'Dalam proses', detail: 'Supplier sedang memproses pesananmu.' },
  COMPLETED: { name: 'Pesanan selesai', detail: 'Supplier mengonfirmasi produk telah diproses.' },
  MANUAL_REVIEW: { name: 'Perlu pemeriksaan', detail: 'Pesanan membutuhkan pengecekan tim. Jangan membayar lagi.' },
  FULFILLMENT_FAILED: { name: 'Pemrosesan bermasalah', detail: 'Hubungi bantuan dengan menyertakan nomor pesanan.' },
  PAYMENT_EXPIRED: { name: 'Waktu pembayaran habis', detail: 'Pembayaran tidak selesai sebelum batas waktu.' },
  PAYMENT_FAILED: { name: 'Pembayaran gagal', detail: 'Pembayaran tidak berhasil diproses.' },
  PAYMENT_ERROR: { name: 'Pembayaran tidak tersedia', detail: 'Pembuatan transaksi belum berhasil.' },
  SANDBOX_PAID: { name: 'Simulasi berhasil', detail: 'Transaksi uji coba. Tidak ada produk yang dikirim.' },
};

const rupiah = (x: number) => 'Rp' + x.toLocaleString('id-ID');

export function ReceiptClient({ id }: { id: string }) {
  const [order, setOrder] = useState<Receipt | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('ah_topup_receipt_' + id);
    if (!token) {
      setError('Akses pesanan tersimpan pada browser tempat checkout dilakukan. Buka pesanan dari perangkat dan browser yang sama.');
      setBusy(false);
      return;
    }
    try {
      const response = await fetch('/api/topup/orders/' + encodeURIComponent(id), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }), cache: 'no-store',
      });
      if (!response.ok) throw new Error('STATUS_NOT_AVAILABLE');
      setOrder(await response.json());
      setError('');
    } catch {
      setError('Status pesanan belum bisa diperbarui. Coba kembali sebentar lagi.');
    } finally {
      setBusy(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 12000);
    return () => clearInterval(timer);
  }, [refresh]);

  const detail = order ? stateLabels[order.state] ?? { name: 'Sedang diproses', detail: 'Status pesanan sedang diperbarui.' } : null;
  const isSuccess = order?.state === 'COMPLETED';
  const isTerminal = ['COMPLETED', 'PAYMENT_EXPIRED', 'PAYMENT_FAILED', 'PAYMENT_ERROR', 'SANDBOX_PAID'].includes(order?.state || '');

  return (
    <div className="min-h-screen bg-[#090A0F] px-4 pb-24 pt-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/topup" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
          <ArrowLeft size={16} /> Kembali ke toko digital
        </Link>
        <div className="mt-9 flex items-center gap-3">
          <ReceiptText size={28} className="text-red-500" />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Status pesanan</h1>
        </div>
        <p className="mt-2 text-sm text-zinc-500">Simpan nomor pesanan untuk menghubungi bantuan jika diperlukan.</p>

        <div className="mt-7 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#11131B]">
          <div className="border-b border-white/[0.08] p-6 sm:p-8">
            {order && detail ? (
              <div className="flex items-start gap-4">
                {isSuccess ? <CheckCircle2 className="mt-1 shrink-0 text-emerald-400" size={28} /> :
                  <Clock3 className="mt-1 shrink-0 text-amber-400" size={28} />}
                <div>
                  <h2 className="text-xl font-bold">{detail.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{detail.detail}</p>
                  {!isTerminal && <p className="mt-2 text-xs text-zinc-500">Status diperbarui otomatis.</p>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">{busy ? 'Mengambil detail pesanan...' : 'Detail pesanan belum tersedia.'}</p>
            )}
            {error && <p role="alert" className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-5 text-amber-200">{error}</p>}
          </div>

          <div className="space-y-4 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-zinc-500">Nomor pesanan</span>
              <button onClick={() => navigator.clipboard?.writeText(id)} className="flex items-center gap-2 break-all text-right font-mono text-xs font-semibold text-white hover:text-red-300">
                {id} <Copy size={14} />
              </button>
            </div>
            {order && (
              <>
                <div className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-zinc-500">Produk</span><span className="max-w-[65%] text-right font-semibold">{order.product}</span>
                </div>
                <div className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-zinc-500">Tujuan</span><span className="font-mono text-right text-xs">{order.target}{order.zone ? ' / ' + order.zone : ''}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/[0.08] pt-5">
                  <span className="text-sm text-zinc-400">Total pembayaran</span>
                  <span className="text-xl font-extrabold">{rupiah(order.payableAmount)}</span>
                </div>
                {order.state === 'AWAITING_PAYMENT' && order.checkoutUrl && (
                  <a target="_blank" rel="noopener noreferrer" href={order.checkoutUrl}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-bold transition-colors hover:bg-red-500">
                    Bayar sekarang <ExternalLink size={16}/>
                  </a>
                )}
                {order.note && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-sm text-emerald-100">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">Informasi pesanan</p>
                    <p className="mt-2 whitespace-pre-wrap break-words">{order.note}</p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] bg-[#0D0F16] px-6 py-4 sm:px-8">
            <p className="flex items-center gap-2 text-xs text-zinc-500"><ShieldCheck size={15}/> Status diverifikasi dari server</p>
            <button onClick={() => { setBusy(true); void refresh(); }} className="flex items-center gap-2 text-xs font-semibold text-zinc-200 hover:text-white">
              <RotateCw size={14} /> Perbarui
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
