'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, CreditCard, Gamepad2, ShieldCheck, UserRound } from 'lucide-react';

type Game = { slug: string; name: string; targetLabel: string; targetHint: string; requiresZone: boolean; zoneLabel: string };
type Product = { sku: string; name: string; price: number; description: string };
const rupiah = (amount: number) => 'Rp' + amount.toLocaleString('id-ID');

const errors: Record<string, string> = {
  STORE_NOT_ACTIVE: 'Toko digital belum menerima pesanan.',
  PRODUCT_UNAVAILABLE: 'Nominal ini sedang tidak tersedia.',
  ZONE_REQUIRED: 'Lengkapi data server atau Zone ID.',
  RATE_LIMITED: 'Terlalu banyak percobaan. Silakan coba beberapa menit lagi.',
  PAYMENT_FEES_NEED_REVIEW: 'Metode pembayaran untuk nominal ini sedang tidak tersedia.',
  CHECKOUT_UNAVAILABLE: 'Checkout sedang tidak tersedia. Coba kembali nanti.',
};

export function TopupCheckout({ game, products }: { game: Game; products: Product[] }) {
  const router = useRouter();
  const [sku, setSku] = useState('');
  const [targetId, setTargetId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chosen = products.find(product => product.sku === sku);
  const enabled = products.length > 0;

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chosen || loading) return;
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/topup/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: chosen.sku, targetId: targetId.trim(), zoneId: zoneId.trim(), name: name.trim(), email: email.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.id || !result.receiptToken) {
        throw new Error(result.error || 'CHECKOUT_UNAVAILABLE');
      }
      localStorage.setItem('ah_topup_receipt_' + result.id, result.receiptToken);
      router.push('/topup/order/' + encodeURIComponent(result.id));
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : '';
      setError(errors[code] || errors.CHECKOUT_UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={checkout} className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.85fr)] lg:items-start">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#11131B] p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-sm font-bold text-red-400">01</span>
            <h2 className="text-lg font-bold tracking-tight">Pilih nominal</h2>
          </div>
          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#0D0F16] px-5 py-12 text-center">
              <Gamepad2 className="mx-auto mb-4 text-zinc-500" size={30} strokeWidth={1.6} />
              <p className="font-semibold text-zinc-200">Nominal belum tersedia</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Layanan sedang tidak tersedia untuk game ini. Silakan lihat game lainnya.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.map(product => (
                <button type="button" key={product.sku} onClick={() => setSku(product.sku)}
                  aria-pressed={sku === product.sku}
                  className={`relative min-h-[108px] rounded-xl border p-4 text-left transition-all ${sku === product.sku ? 'border-red-500 bg-red-500/[0.09]' : 'border-white/[0.1] bg-[#0D0F16] hover:border-white/30'}`}>
                  {sku === product.sku && <Check size={15} className="absolute right-3 top-3 text-red-400" />}
                  <span className="block max-w-[calc(100%-10px)] text-[13px] font-semibold leading-5 text-zinc-100">{product.name}</span>
                  <span className="mt-3 block text-sm font-bold text-red-400">{rupiah(product.price)}</span>
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-white/[0.09] bg-[#11131B] p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-sm font-bold text-red-400">02</span>
            <h2 className="text-lg font-bold tracking-tight">Data akun game</h2>
          </div>
          <div className={`grid gap-4 ${game.requiresZone ? 'sm:grid-cols-2' : ''}`}>
            <label className="block text-xs font-medium text-zinc-300">
              {game.targetLabel}
              <input required minLength={3} maxLength={120} value={targetId} onChange={e => setTargetId(e.target.value)}
                placeholder={game.targetLabel} autoComplete="off"
                className="mt-2 block w-full rounded-xl border border-white/[0.1] bg-[#0D0F16] px-4 py-3.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500" />
            </label>
            {game.requiresZone && (
              <label className="block text-xs font-medium text-zinc-300">
                {game.zoneLabel}
                <input required maxLength={80} value={zoneId} onChange={e => setZoneId(e.target.value)}
                  placeholder={game.zoneLabel} autoComplete="off"
                  className="mt-2 block w-full rounded-xl border border-white/[0.1] bg-[#0D0F16] px-4 py-3.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500" />
              </label>
            )}
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-500">{game.targetHint} Pastikan sesuai ketentuan produk sebelum membayar.</p>
        </section>
      </div>

      <div className="space-y-5 lg:sticky lg:top-24">
        <section className="rounded-2xl border border-white/[0.09] bg-[#11131B] p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-sm font-bold text-red-400">03</span>
            <h2 className="text-lg font-bold tracking-tight">Detail pesanan</h2>
          </div>
          <label className="block text-xs font-medium text-zinc-300">Nama pembeli
            <input required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)}
              placeholder="Nama kamu" autoComplete="name"
              className="mt-2 block w-full rounded-xl border border-white/[0.1] bg-[#0D0F16] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500" />
          </label>
          <label className="mt-4 block text-xs font-medium text-zinc-300">Email
            <input required type="email" maxLength={200} value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@contoh.com" autoComplete="email"
              className="mt-2 block w-full rounded-xl border border-white/[0.1] bg-[#0D0F16] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500" />
          </label>
          <p className="mt-2 text-xs text-zinc-500">Simpan nomor pesanan untuk mengecek status top up.</p>

          <div className="my-6 h-px bg-white/[0.08]" />
          <div className="flex justify-between gap-3 text-sm text-zinc-400">
            <span>Produk</span><span className="max-w-[60%] text-right font-medium text-zinc-200">{chosen?.name || 'Belum dipilih'}</span>
          </div>
          <div className="mt-4 flex justify-between gap-3 text-sm text-zinc-400">
            <span>Metode pembayaran</span><span className="flex items-center gap-2 font-medium text-zinc-200"><CreditCard size={15}/> QRIS</span>
          </div>
          <div className="my-5 h-px bg-white/[0.08]" />
          <div className="flex items-end justify-between">
            <span className="text-sm font-semibold">Total produk</span>
            <strong className="text-2xl tracking-tight">{chosen ? rupiah(chosen.price) : '—'}</strong>
          </div>
          <p className="mt-2 text-right text-[11px] text-zinc-500">Biaya metode pembayaran jika ada ditampilkan oleh penyedia pembayaran.</p>

          {error && <p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-200">{error}</p>}
          <button disabled={!chosen || loading || !enabled} type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500">
            {loading ? 'Menyiapkan pembayaran...' : 'Lanjut ke pembayaran'} {!loading && <ChevronRight size={18} />}
          </button>
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
            <ShieldCheck size={14} /> Pesanan diproses setelah pembayaran terverifikasi
          </div>
        </section>
      </div>
    </form>
  );
}
