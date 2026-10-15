'use client';

import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ShieldCheck } from 'lucide-react';

type Product = { sku: string; name: string; description: string; price: number };
const money = (price: number) => 'Rp' + price.toLocaleString('id-ID');

export function CatalogPreview({ products, capturedAt }: { products: Product[]; capturedAt: string | null }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'cheapest' | 'name'>('cheapest');
  const [limit, setLimit] = useState(24);
  const formattedDate = capturedAt
    ? new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(capturedAt))
    : null;
  const filtered = useMemo(() => {
    const term = query.toLocaleLowerCase('id-ID').trim();
    const result = products.filter(p => !term || p.name.toLocaleLowerCase('id-ID').includes(term) || p.sku.toLocaleLowerCase('id-ID').includes(term));
    return result.sort((a, b) => sort === 'cheapest' ? a.price - b.price || a.name.localeCompare(b.name) : a.name.localeCompare(b.name));
  }, [products, query, sort]);
  const visible = filtered.slice(0, limit);

  return (
    <section aria-labelledby="catalog-title" className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#11131B] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-400">Katalog produk digital</p>
          <h2 id="catalog-title" className="text-2xl font-bold tracking-tight">Pilihan nominal & harga</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {products.length} nominal tercatat dari VIPayment
            {formattedDate ? ' · Pembaruan terakhir ' + formattedDate + ' WIB' : ''}.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.08] px-3 py-2 text-xs font-semibold text-amber-200">
          <ShieldCheck size={14}/> Belum menerima pembelian
        </span>
      </div>
      <p className="mt-5 rounded-xl border border-white/[0.07] bg-[#0D0F16] p-4 text-xs leading-6 text-zinc-400">
        Harga referensi berdasarkan katalog supplier pada waktu pembaruan, ditambah estimasi margin Anime Home.
        Harga dan ketersediaan dapat berubah sebelum transaksi dibuka. Belum termasuk biaya metode pembayaran.
      </p>
      {products.length ? (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label className="flex w-full items-center gap-3 rounded-xl border border-white/[0.1] bg-[#0D0F16] px-4 focus-within:border-red-500/50">
              <Search size={17} className="shrink-0 text-zinc-500"/>
              <span className="sr-only">Cari nominal</span>
              <input value={query} onChange={e=>{setQuery(e.target.value);setLimit(24);}} placeholder="Cari nominal atau nama produk..."
                className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-600"/>
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#0D0F16] px-3">
              <SlidersHorizontal size={16} className="shrink-0 text-zinc-500"/>
              <span className="sr-only">Urutan produk</span>
              <select value={sort} onChange={e=>setSort(e.target.value as 'cheapest' | 'name')}
                className="w-full bg-transparent py-3 text-sm text-zinc-200 outline-none sm:w-[150px]">
                <option value="cheapest">Harga terendah</option>
                <option value="name">Nama A–Z</option>
              </select>
            </label>
          </div>
          <p aria-live="polite" className="mt-4 text-xs text-zinc-500">Menampilkan {visible.length} dari {filtered.length} produk</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(product=> (
              <article key={product.sku} className="flex min-h-[118px] flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0D0F16] p-4">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-zinc-100">{product.name}</h3>
                  <p className="mt-1 break-all text-[11px] text-zinc-500">SKU {product.sku}</p>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <span className="text-base font-bold tracking-tight text-white">{money(product.price)}</span>
                  <span className="text-[11px] text-zinc-500">Lihat harga</span>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && <p className="py-10 text-center text-sm text-zinc-400">Nominal tidak ditemukan.</p>}
          {filtered.length > visible.length && (
            <button type="button" onClick={()=>setLimit(n=>n+24)}
              className="mt-6 w-full rounded-xl border border-white/[0.14] bg-[#171923] px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-white/30">
              Lihat {Math.min(24,filtered.length-visible.length)} produk lainnya
            </button>
          )}
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-white/[0.12] bg-[#0D0F16] p-10 text-center">
          <h3 className="font-semibold text-zinc-200">Produk belum tersinkronisasi</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">Katalog sedang disiapkan. Belum ada harga yang bisa ditampilkan.</p>
        </div>
      )}
    </section>
  );
}
