'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/services/store';
import { AnimeCard } from '@/components/catalog/AnimeCard';
import { Search, X } from 'lucide-react';

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  const genres = ['Semua', 'Action', 'Adventure', 'Fantasy', 'Drama', 'Comedy', 'Sci-Fi'];
  const statuses = [
    { label: 'Semua Status', value: 'Semua' },
    { label: 'Sedang Tayang', value: 'airing' },
    { label: 'Tamat', value: 'completed' },
  ];

  const filteredAnime = useMemo(() => {
    return db.getAnimeList({
      query: searchQuery || undefined,
      genre: selectedGenre !== 'Semua' ? selectedGenre : undefined,
      status: selectedStatus !== 'Semua' ? selectedStatus : undefined,
    });
  }, [searchQuery, selectedGenre, selectedStatus]);

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 max-w-7xl mx-auto pt-4 pb-16">
      {/* Header & Search */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl sm:text-2xl font-black text-white">
          Katalog Anime
        </h1>

        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul anime (Romaji, Inggris, Indonesia)..."
            className="w-full rounded-xl bg-zinc-900 border border-white/[0.08] py-2.5 pl-10 pr-9 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-white/[0.06] py-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedGenre === g
                  ? 'bg-white text-black font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg bg-zinc-900 border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Anime Grid */}
      <div>
        {filteredAnime.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredAnime.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-12 text-center text-xs text-zinc-500">
            Tidak ada anime yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-500">Memuat katalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
