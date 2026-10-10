'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { MerchItem } from '@/types';
import { ShoppingBag, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { QuickCheckoutModal } from './QuickCheckoutModal';

interface EpisodeMerchShowcaseProps {
  animeId: string;
  animeTitle: string;
}

export function EpisodeMerchShowcase({ animeId, animeTitle }: EpisodeMerchShowcaseProps) {
  const [selectedMerch, setSelectedMerch] = useState<MerchItem | null>(null);

  // Get merch for this anime or general dropship merch
  const items = db.getMerchByAnimeId(animeId);
  const displayItems = items.length > 0 ? items.slice(0, 4) : db.getAllMerch().slice(0, 4);

  if (displayItems.length === 0) return null;

  const handleOpenChat = (item: MerchItem) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-anime-chat-merch', { detail: { merch: item } }));
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-500">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Merchandise Pilihan: {animeTitle}
              <span className="text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Dropship Resmi
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Koleksi apparel & figure resmi bergaransi pengiriman atas nama Anime Home Store.
            </p>
          </div>
        </div>
      </div>

      {/* Merch Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="group rounded-xl border border-white/[0.06] bg-zinc-950 p-2.5 flex flex-col justify-between hover:border-red-500/40 hover:bg-zinc-900/60 transition-all shadow-sm"
          >
            <div>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900 mb-2 border border-white/5">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[9px] font-bold bg-black/70 backdrop-blur-md text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Ready Stock
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-0.5">
                {item.category === 'figure' ? 'Action Figure' : item.category === 'accessory' ? 'Aksesoris' : 'Apparel DTF'}
              </span>
              <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                {item.name}
              </h4>
            </div>

            <div className="pt-2 mt-2 border-t border-white/[0.06] space-y-1.5">
              <div className="text-xs font-black text-emerald-400">
                {formatRupiah(item.price)}
              </div>
              <button
                onClick={() => setSelectedMerch(item)}
                className="w-full py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
              >
                <span>Beli Sekarang</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Modal */}
      {selectedMerch && (
        <QuickCheckoutModal
          item={selectedMerch}
          onClose={() => setSelectedMerch(null)}
          onOpenChatWithMerch={handleOpenChat}
        />
      )}
    </div>
  );
}
