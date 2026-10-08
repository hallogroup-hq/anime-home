'use client';

import { useState, useMemo } from 'react';
import { db } from '@/lib/services/store';
import { AnimeCard } from '@/components/catalog/AnimeCard';
import { Search, Filter, X, Film, CheckCircle2 } from 'lucide-react';

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');

  const genres = ['Semua', 'Action', 'Adventure', 'Fantasy', 'Drama', 'Comedy', 'Sci-Fi'];
  const statuses = [
    { label: 'Semua Status', value: 'Semua' },
    { label: 'Sedang Tayang (Ongoing)', value: 'airing' },
    { label: 'Tamat (Completed)', value: 'completed' },
  ];

  const filteredAnime = useMemo(() => {
    return db.getAnimeList({
      query: searchQuery || undefined,
      genre: selectedGenre !== 'Semua' ? selectedGenre : undefined,
      status: selectedStatus !== 'Semua' ? selectedStatus : undefined,
    });
  }, [searchQuery, selectedGenre, selectedStatus]);

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 max-w-7xl mx-auto pt-4">
      {/* Search Header */}
      <div className="flex flex-col gap-3">
        <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
          Katalog Anime & Pencarian Judul
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Cari berdasarkan judul resmi, alias Romaji, Kanji, atau terjemahan Indonesia.
        </p>

        {/* Search Input Bar */}
        <div className="relative w-full max-w-2xl mt-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari contoh: Frieren, Kimetsu, Pembantai, Solo Leveling..."
            className="w-full rounded-2xl bg-surface-900 border border-border-700 py-3.5 pl-12 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-y border-border-800 py-3">
        {/* Genre Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Genre:
          </span>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedGenre === g
                  ? 'bg-brand text-white'
                  : 'bg-surface-900 text-slate-400 hover:text-white border border-border-800'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl bg-surface-900 border border-border-700 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-slate-400">
            Ditemukan <span className="font-bold text-white">{filteredAnime.length}</span> anime
          </span>
        </div>

        {filteredAnime.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredAnime.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        ) : (
          /* Empty Search State — PRD FR-SEARCH Acceptance */
          <div className="rounded-3xl border border-border-800 bg-surface-900/40 p-12 text-center flex flex-col items-center">
            <Film className="h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white">Tidak Ada Anime Ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Tidak ada anime yang cocok dengan kata kunci &quot;{searchQuery}&quot;. Coba periksa ejaan judul atau reset filter Anda.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('Semua');
                setSelectedStatus('Semua');
              }}
              className="mt-4 rounded-xl bg-surface-800 border border-border-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-surface-700"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
