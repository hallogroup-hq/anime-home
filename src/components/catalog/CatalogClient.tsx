'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/services/store';
import { AnimeCard } from '@/components/catalog/AnimeCard';
import { Search, X, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaType } from '@/types';

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedYear, setSelectedYear] = useState<string>('Semua');
  const [selectedSeason, setSelectedSeason] = useState<string>('Semua');
  const [selectedFormat, setSelectedFormat] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<'popular' | 'latest' | 'title_asc'>('popular');
  const [page, setPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedGenre, selectedStatus, selectedYear, selectedSeason, selectedFormat, sortBy]);

  const genres = ['Semua', 'Action', 'Adventure', 'Fantasy', 'Drama', 'Comedy', 'Sci-Fi', 'Supernatural'];
  const statuses = [
    { label: 'Semua Status', value: 'Semua' },
    { label: 'Sedang Tayang', value: 'airing' },
    { label: 'Tamat', value: 'completed' },
  ];
  const years = ['Semua', '2024', '2023', '2022', '2021', '2020'];
  const seasons = ['Semua', 'Winter', 'Spring', 'Summer', 'Fall'];
  const formats = ['Semua', 'TV', 'Movie', 'OVA', 'ONA'];
  const sortOptions = [
    { label: 'Paling Populer', value: 'popular' },
    { label: 'Rilis Terbaru', value: 'latest' },
    { label: 'Judul (A - Z)', value: 'title_asc' },
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('Semua');
    setSelectedStatus('Semua');
    setSelectedYear('Semua');
    setSelectedSeason('Semua');
    setSelectedFormat('Semua');
    setSortBy('popular');
    setPage(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedGenre !== 'Semua' ||
    selectedStatus !== 'Semua' ||
    selectedYear !== 'Semua' ||
    selectedSeason !== 'Semua' ||
    selectedFormat !== 'Semua' ||
    sortBy !== 'popular';

  const filteredAnime = useMemo(() => {
    return db.getAnimeList({
      query: searchQuery || undefined,
      genre: selectedGenre !== 'Semua' ? selectedGenre : undefined,
      status: selectedStatus !== 'Semua' ? selectedStatus : undefined,
      year: selectedYear !== 'Semua' ? Number(selectedYear) : undefined,
      seasonPeriod: selectedSeason !== 'Semua' ? selectedSeason : undefined,
      mediaType: selectedFormat !== 'Semua' ? (selectedFormat as MediaType) : undefined,
      sortBy,
    });
  }, [searchQuery, selectedGenre, selectedStatus, selectedYear, selectedSeason, selectedFormat, sortBy]);

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 max-w-7xl mx-auto pt-4 pb-16">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Katalog Anime
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Jelajahi seluruh anime terlengkap dengan filter multi-kriteria dan urutan tontonan.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul (Romaji, Inggris, Indonesia)..."
            className="w-full rounded-xl bg-zinc-900 border border-white/[0.08] py-2 pl-10 pr-9 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
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

      {/* Primary Genre Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            className={`rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedGenre === g
                ? 'bg-white text-black font-bold shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-white/[0.06] py-3 text-xs bg-zinc-900/30 px-3.5 rounded-xl">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
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

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-lg bg-zinc-900 border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="Semua">Semua Tahun</option>
            {years
              .filter((y) => y !== 'Semua')
              .map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
          </select>

          {/* Season Filter */}
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="rounded-lg bg-zinc-900 border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="Semua">Semua Musim</option>
            {seasons
              .filter((s) => s !== 'Semua')
              .map((s) => (
                <option key={s} value={s}>
                  Musim {s}
                </option>
              ))}
          </select>

          {/* Format Filter */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="rounded-lg bg-zinc-900 border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="Semua">Semua Format</option>
            {formats
              .filter((f) => f !== 'Semua')
              .map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
          </select>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg bg-zinc-900 border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-zinc-200 focus:outline-none cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          Menampilkan <strong className="text-white">{filteredAnime.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(page * ITEMS_PER_PAGE, filteredAnime.length)}</strong> dari <strong className="text-white">{filteredAnime.length}</strong> judul anime (5 baris per halaman)
        </span>
        {Math.ceil(filteredAnime.length / ITEMS_PER_PAGE) > 1 && (
          <span className="text-zinc-500 hidden sm:inline">
            Halaman {page} dari {Math.ceil(filteredAnime.length / ITEMS_PER_PAGE)}
          </span>
        )}
      </div>

      {/* Anime Grid */}
      <div>
        {filteredAnime.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredAnime
                .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                .map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
            </div>

            {/* Pagination Controls */}
            {Math.ceil(filteredAnime.length / ITEMS_PER_PAGE) > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-8 border-t border-white/[0.06] mt-6 flex-wrap">
                <button
                  onClick={() => {
                    setPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                {Array.from({ length: Math.ceil(filteredAnime.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      page === p
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                        : 'bg-zinc-900 border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setPage(prev => Math.min(prev + 1, Math.ceil(filteredAnime.length / ITEMS_PER_PAGE)));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === Math.ceil(filteredAnime.length / ITEMS_PER_PAGE)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-zinc-900/40 border border-white/[0.04] mt-2">
            <p className="text-sm font-semibold text-zinc-300">
              Tidak ada anime yang cocok dengan filter yang dipilih.
            </p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Coba gunakan kata kunci lain atau klik &quot;Reset Filter&quot; untuk menampilkan seluruh katalog.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CatalogClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-xs text-zinc-500">
          Memuat katalog anime...
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
