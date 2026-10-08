'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FranchiseWatchOrderItem } from '@/types';
import { Film, Tv, Video, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface WatchOrderGuideProps {
  items: FranchiseWatchOrderItem[];
  currentAnimeId: string;
}

export function WatchOrderGuide({ items, currentAnimeId }: WatchOrderGuideProps) {
  const [viewMode, setViewMode] = useState<'chronological' | 'release'>('chronological');

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-6 text-center text-xs text-zinc-500">
        Panduan urutan nonton untuk waralaba ini belum tersedia.
      </div>
    );
  }

  const franchiseName = items[0]?.franchiseName || 'Waralaba Anime';

  const sortedItems = [...items].sort((a, b) => {
    if (viewMode === 'release') {
      return a.year - b.year || a.orderNumber - b.orderNumber;
    }
    return a.orderNumber - b.orderNumber;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-white/[0.06] p-4 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Panduan Urutan Nonton:</span>
            <span className="text-red-400 font-extrabold">{franchiseName}</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Rekomendasi urutan tontonan terbaik agar tidak terlewat alur cerita canon maupun film terkait.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-white/[0.06] text-xs self-start sm:self-auto">
          <button
            onClick={() => setViewMode('chronological')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              viewMode === 'chronological'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Alur Cerita (Kronologis)
          </button>
          <button
            onClick={() => setViewMode('release')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              viewMode === 'release'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Tahun Rilis
          </button>
        </div>
      </div>

      {/* Ordered Timeline List */}
      <div className="flex flex-col gap-2.5">
        {sortedItems.map((item, index) => {
          const isCurrent = item.animeId === currentAnimeId;

          const badgeColor = 
            item.canonStatus === 'Canon'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : item.canonStatus === 'Canon Movie'
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700';

          return (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-zinc-900 border-red-500/40 ring-1 ring-red-500/20'
                  : 'bg-zinc-900/40 border-white/[0.06] hover:border-zinc-700 hover:bg-zinc-900/70'
              }`}
            >
              {/* Order Number & Title */}
              <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                  isCurrent ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {index + 1}
                </span>

                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      {item.title}
                    </span>
                    {isCurrent && (
                      <span className="rounded bg-red-600/20 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase">
                        Sedang Dilihat
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="font-medium text-zinc-300">{item.year}</span>
                    <span>•</span>
                    <span>{item.type}</span>
                    <span>•</span>
                    <span>{item.episodesCount} Episode</span>
                    <span>•</span>
                    <span className={`rounded border px-1.5 py-0.2 text-[10px] font-semibold ${badgeColor}`}>
                      {item.canonStatus}
                    </span>
                  </div>

                  {item.note && (
                    <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                      {item.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {item.slug ? (
                <Link
                  href={`/anime/${item.slug}`}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <span>Buka Seri</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="text-[11px] text-zinc-500 italic shrink-0">
                  Segera Hadir
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
