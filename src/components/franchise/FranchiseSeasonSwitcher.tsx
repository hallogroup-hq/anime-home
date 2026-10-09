'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FranchiseWatchOrderItem } from '@/types';
import { Layers, Film, Tv, ChevronRight, Search } from 'lucide-react';

interface FranchiseSeasonSwitcherProps {
  items: FranchiseWatchOrderItem[];
  currentAnimeId: string;
}

export function FranchiseSeasonSwitcher({ items, currentAnimeId }: FranchiseSeasonSwitcherProps) {
  const router = useRouter();
  const [filterType, setFilterType] = useState<'ALL' | 'TV' | 'Movie'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // If there's only 1 item or empty, no need to show a franchise switcher
  if (!items || items.length <= 1) {
    return null;
  }

  const franchiseName = items[0]?.franchiseName || 'Waralaba Anime';

  const tvCount = useMemo(() => items.filter(it => it.type === 'TV Series' || it.type === 'TV').length, [items]);
  const movieCount = useMemo(() => items.filter(it => it.type === 'Movie').length, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const isTv = item.type === 'TV Series' || item.type === 'TV';
      const matchesType =
        filterType === 'ALL' ||
        (filterType === 'TV' && isTv) ||
        (filterType === 'Movie' && item.type === 'Movie');

      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.year).includes(searchQuery);

      return matchesType && matchesSearch;
    });
  }, [items, filterType, searchQuery]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSlug = e.target.value;
    if (selectedSlug) {
      router.push(`/anime/${selectedSlug}`);
    }
  };

  const currentItem = items.find(it => it.animeId === currentAnimeId);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 p-4 sm:p-5 shadow-xl backdrop-blur-sm">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 border border-red-500/20 text-red-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Pilih Season & Film Waralaba
              </h3>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 border border-white/[0.05]">
                {items.length} Entri
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Waralaba <span className="font-semibold text-zinc-300">{franchiseName}</span> — Lompat ke season atau film lain dengan 1 klik
            </p>
          </div>
        </div>

        {/* QUICK SELECT DROPDOWN FOR RAPID JUMP */}
        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <select
            value={currentItem?.slug || ''}
            onChange={handleSelectChange}
            aria-label="Pilih season atau film waralaba"
            className="w-full sm:w-64 rounded-xl border border-white/[0.1] bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
          >
            <option value="" disabled>
              Lompat cepat ke season / film...
            </option>
            {items.map((it) => (
              <option key={it.id} value={it.slug}>
                {it.animeId === currentAnimeId ? '★ ' : ''}
                {it.title} ({it.year} • {it.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FILTER BUTTONS & SEARCH BAR IF MANY ITEMS */}
      {items.length > 4 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.05]">
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-zinc-800 text-white font-bold border border-white/[0.1]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Semua ({items.length})
            </button>
            {tvCount > 0 && (
              <button
                onClick={() => setFilterType('TV')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  filterType === 'TV'
                    ? 'bg-zinc-800 text-white font-bold border border-white/[0.1]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Tv className="h-3 w-3" />
                <span>Serial TV ({tvCount})</span>
              </button>
            )}
            {movieCount > 0 && (
              <button
                onClick={() => setFilterType('Movie')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  filterType === 'Movie'
                    ? 'bg-zinc-800 text-white font-bold border border-white/[0.1]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Film className="h-3 w-3" />
                <span>Film ({movieCount})</span>
              </button>
            )}
          </div>

          {items.length > 8 && (
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari season/film..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-zinc-950/70 pl-8 pr-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:border-red-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* HORIZONTAL SCROLLABLE LIST OF SEASONS / MOVIES */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {filteredItems.map((item) => {
          const isCurrent = item.animeId === currentAnimeId;

          return (
            <Link
              key={item.id}
              href={item.slug ? `/anime/${item.slug}` : '#'}
              className={`group flex shrink-0 flex-col justify-between rounded-xl border p-3 transition-all min-w-[200px] max-w-[240px] ${
                isCurrent
                  ? 'bg-red-950/30 border-red-500/50 ring-1 ring-red-500/30'
                  : 'bg-zinc-900/50 border-white/[0.06] hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      item.type === 'Movie'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}
                  >
                    {item.type === 'Movie' ? <Film className="h-2.5 w-2.5" /> : <Tv className="h-2.5 w-2.5" />}
                    <span>{item.type}</span>
                  </span>

                  {isCurrent ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      Aktif
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-zinc-500">
                      {item.year}
                    </span>
                  )}
                </div>

                <h4
                  className={`text-xs font-bold line-clamp-2 leading-snug transition-colors ${
                    isCurrent ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                  }`}
                  title={item.title}
                >
                  {item.title}
                </h4>
              </div>

              <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/[0.04] text-[11px] text-zinc-400">
                <span>{item.episodesCount} Episode</span>
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-zinc-400 group-hover:text-white transition-colors">
                  <span>Lihat</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
