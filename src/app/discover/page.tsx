'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { MerchItem } from '@/types';
import { Search, ShoppingBag, Sparkles, ArrowRight, ShieldCheck, MessageSquare } from 'lucide-react';
import { QuickCheckoutModal } from '@/components/merch/QuickCheckoutModal';

export default function DiscoverPage() {
  const merchItems = db.getAllMerch();
  const [selectedFilter, setSelectedFilter] = useState('Semua');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'apparel' | 'figure' | 'accessory'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutItem, setCheckoutItem] = useState<MerchItem | null>(null);

  const animeTitles = ['Semua', ...Array.from(new Set(merchItems.map(m => m.animeTitle)))];

  const filteredItems = merchItems.filter(item => {
    const matchesAnime = selectedFilter === 'Semua' || item.animeTitle === selectedFilter;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.animeTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAnime && matchesCategory && matchesSearch;
  });

  const handleOpenChat = (item: MerchItem) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-anime-chat-merch', { detail: { merch: item } }));
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 max-w-7xl mx-auto pt-4 pb-20">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-red-500" />
              <span>Anime Home Store</span>
            </h1>
            <span className="text-[10px] font-bold bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Dropship Resmi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Koleksi kaos oversized aesthetic, hoodie, action figure, dan pernak-pernik resmi atas nama Anime Home Store.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kaos, figure, Conan, Frieren..."
            className="w-full rounded-xl bg-zinc-900 border border-white/[0.08] py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06]'
          }`}
        >
          Semua Kategori
        </button>
        <button
          onClick={() => setSelectedCategory('apparel')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            selectedCategory === 'apparel'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06]'
          }`}
        >
          👕 Kaos & Hoodie DTF
        </button>
        <button
          onClick={() => setSelectedCategory('figure')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            selectedCategory === 'figure'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06]'
          }`}
        >
          🎎 Action Figure & Nendoroid
        </button>
        <button
          onClick={() => setSelectedCategory('accessory')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            selectedCategory === 'accessory'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06]'
          }`}
        >
          ✨ Aksesoris & Ganci
        </button>
      </div>

      {/* Anime Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.06] scrollbar-none text-xs">
        {animeTitles.map((title) => {
          const isSelected = selectedFilter === title;
          const count = title === 'Semua' 
            ? merchItems.length 
            : merchItems.filter(m => m.animeTitle === title).length;

          return (
            <button
              key={title}
              onClick={() => setSelectedFilter(title)}
              className={`rounded-xl px-3 py-1.5 font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow-md'
                  : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>{title}</span>
              <span className={`text-[10px] ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Merch Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-xl bg-zinc-900/90 border border-white/[0.06] overflow-hidden group hover:border-red-500/40 hover:bg-zinc-900 transition-all shadow-sm justify-between"
            >
              <div>
                <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-zinc-200 line-clamp-1 max-w-[85%]">
                    {item.animeTitle}
                  </span>
                  <span className="absolute top-2 right-2 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    <span>Garansi Toko</span>
                  </span>
                </div>

                <div className="p-3">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-0.5">
                    {item.category === 'figure' ? 'Action Figure' : item.category === 'accessory' ? 'Aksesoris' : 'Apparel DTF'}
                  </span>
                  <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm sm:text-base font-black text-emerald-400 mt-1.5">
                    {formatRupiah(item.price)}
                  </p>
                  <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                    {item.storeName}
                  </span>
                </div>
              </div>

              <div className="p-3 pt-0 space-y-1.5">
                <button
                  onClick={() => setCheckoutItem(item)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white py-2 text-xs font-bold transition-all cursor-pointer shadow-md shadow-red-600/20"
                >
                  <span>Beli Cepat (QRIS)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-12 text-center text-xs text-zinc-500">
          Tidak ada produk merchandise ditemukan untuk filter atau kata kunci &quot;{searchQuery || selectedFilter}&quot;.
        </div>
      )}

      {/* Quick Checkout Modal */}
      {checkoutItem && (
        <QuickCheckoutModal
          item={checkoutItem}
          onClose={() => setCheckoutItem(null)}
          onOpenChatWithMerch={handleOpenChat}
        />
      )}
    </div>
  );
}
