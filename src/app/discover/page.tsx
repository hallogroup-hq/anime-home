'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { ExternalLink, Search, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function DiscoverPage() {
  const merchItems = db.getAllMerch();
  const [selectedFilter, setSelectedFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const animeTitles = ['Semua', ...Array.from(new Set(merchItems.map(m => m.animeTitle)))];

  const filteredItems = merchItems.filter(item => {
    const matchesFilter = selectedFilter === 'Semua' || item.animeTitle === selectedFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.animeTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const fallbackSvg =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%2318181b"/><text x="50%" y="50%" fill="%2371717a" font-size="16" font-family="sans-serif" text-anchor="middle">OFFICIAL MERCH</text></svg>';

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 max-w-7xl mx-auto pt-4 pb-20">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-red-500" />
            <span>Merchandise Resmi Anime</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Koleksi figur, nendoroid, model kit, dan apparel resmi dari toko mitra terverifikasi di Indonesia.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari figur, nendoroid, seri..."
            className="w-full rounded-xl bg-zinc-900 border border-white/[0.08] py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs */}
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
              className={`rounded-xl px-3.5 py-1.5 font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-red-600 text-white font-bold shadow-lg shadow-red-600/30'
                  : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>{title}</span>
              <span className={`text-[10px] ${isSelected ? 'text-red-200' : 'text-zinc-500'}`}>
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
              className="flex flex-col rounded-xl bg-zinc-900/90 border border-white/[0.06] overflow-hidden group hover:border-zinc-700 transition-all"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackSvg;
                  }}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 left-2 rounded-md bg-black/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-zinc-200 line-clamp-1 max-w-[85%]">
                  {item.animeTitle}
                </span>
                <span className="absolute top-2 right-2 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  <span>Resmi</span>
                </span>
              </div>

              <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm sm:text-base font-black text-white mt-1.5">
                    Rp {item.price.toLocaleString('id-ID')}
                  </p>
                  <span className="text-[10px] text-zinc-400 block mt-1 truncate">
                    {item.storeName}
                  </span>
                </div>

                <a
                  href={item.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 text-zinc-200 hover:text-white py-2 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  <span>Lihat Produk</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-12 text-center text-xs text-zinc-500">
          Tidak ada produk merchandise ditemukan untuk filter atau kata kunci &quot;{searchQuery || selectedFilter}&quot;.
        </div>
      )}
    </div>
  );
}
