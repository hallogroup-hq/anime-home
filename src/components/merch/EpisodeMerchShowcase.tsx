'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { MerchItem } from '@/types';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { ProductDetailModal } from './ProductDetailModal';
import { QuickCheckoutModal } from './QuickCheckoutModal';

interface EpisodeMerchShowcaseProps {
  animeId: string;
  animeTitle: string;
}

export function EpisodeMerchShowcase({ animeId, animeTitle }: EpisodeMerchShowcaseProps) {
  const [detailItem, setDetailItem] = useState<MerchItem | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<{ item: MerchItem; variant: string } | null>(null);

  // Get merch for this anime or general dropship merch
  const items = db.getMerchByAnimeId(animeId);
  const displayItems = items.length > 0 ? items.slice(0, 4) : db.getAllMerch().slice(0, 4);

  if (displayItems.length === 0) return null;

  const handleOpenChat = (item: MerchItem) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-anime-chat-merch', { detail: { merch: item } }));
    }
  };

  const handleProceedToCheckout = (item: MerchItem, selectedVariant: string) => {
    setDetailItem(null);
    setCheckoutItem({ item, variant: selectedVariant });
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Merchandise Pilihan: {animeTitle}
              <span className="text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded">
                Official Merchandise
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Koleksi apparel & action figure resmi dikemas atas nama Anime Home Store.
            </p>
          </div>
        </div>
      </div>

      {/* Merch Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {displayItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setDetailItem(item)}
            className="group rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 flex flex-col justify-between hover:border-zinc-700 hover:bg-zinc-900 transition-all shadow-sm cursor-pointer"
          >
            <div>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900 mb-2 border border-zinc-800">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[9px] font-semibold bg-black/80 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
                    Stok Tersedia
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-0.5">
                {item.category === 'figure' ? 'Action Figure' : item.category === 'accessory' ? 'Aksesoris' : 'Apparel'}
              </span>
              <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                {item.name}
              </h4>
            </div>

            <div className="pt-2 mt-2 border-t border-zinc-800/80 space-y-1.5">
              <div className="text-xs font-bold text-white">
                {formatRupiah(item.price)}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailItem(item);
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer border border-zinc-700"
              >
                <span>Lihat Detail</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      {detailItem && (
        <ProductDetailModal
          item={detailItem}
          isOpen={true}
          onClose={() => setDetailItem(null)}
          onProceedToCheckout={handleProceedToCheckout}
          onAskCS={handleOpenChat}
        />
      )}

      {/* Quick Checkout Modal */}
      {checkoutItem && (
        <QuickCheckoutModal
          item={checkoutItem.item}
          initialVariant={checkoutItem.variant}
          onClose={() => setCheckoutItem(null)}
          onOpenChatWithMerch={handleOpenChat}
        />
      )}
    </div>
  );
}
