'use client';

import { db } from '@/lib/services/store';
import { ShoppingBag, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

export default function DiscoverPage() {
  const merchItems = db.getAllMerch();

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 max-w-7xl mx-auto pt-4 pb-16">
      <div>
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            Merchandise & Fandom Discovery
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Etalase kurasi barang anime resmi dari toko dan kreator terverifikasi. Kami memprioritaskan keamanan pembeli dan keterbukaan tautan.
        </p>
      </div>

      {/* Shopee Gating Transparency Disclosure Banner (PRD Bab 13.4 & Gate) */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex flex-col text-xs text-slate-300">
          <span className="font-bold text-amber-300">Kebijakan Kemitraan & Penautan Toko:</span>
          <p className="mt-0.5 text-slate-400">
            Seluruh tautan mengarah langsung ke toko resmi mitra. Sesuai dengan kepatuhan kebijakan Shopee Affiliate untuk platform penyiaran media, pelacakan komisi otomatis saat ini berstatus <span className="text-white font-semibold underline">Gated / Dinonaktifkan</span> sampai proses izin resmi diterbitkan.
          </p>
        </div>
      </div>

      {/* Merch Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {merchItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col rounded-3xl bg-surface-900 border border-border-800 overflow-hidden hover:border-slate-700 transition-all group"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-ink-950">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 rounded-lg bg-ink-950/80 backdrop-blur-md px-2 py-1 text-[10px] font-bold text-slate-300 border border-white/10">
                {item.animeTitle}
              </span>
            </div>

            <div className="p-4 flex flex-col flex-1 justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                  {item.name}
                </h3>
                <p className="text-base font-extrabold text-amber-400 mt-1">
                  Rp {item.price.toLocaleString('id-ID')}
                </p>
                <span className="text-xs text-slate-500 block mt-0.5">{item.storeName}</span>
              </div>

              <a
                href={item.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-surface-800 border border-border-700 py-2.5 text-xs font-bold text-white hover:bg-amber-500 hover:text-black transition-colors"
              >
                <span>Kunjungi Toko Mitra</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
