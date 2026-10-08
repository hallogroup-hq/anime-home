'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/services/store';
import { AnimeCard } from '@/components/catalog/AnimeCard';
import { SafeAdSlot } from '@/components/ads/SafeAdSlot';
import { getContinueWatchingList } from '@/lib/services/watchlist';
import { Play, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const allAnime = db.getAnimeList();
  const heroAnime = allAnime[0]; // Frieren
  const [continueWatching, setContinueWatching] = useState<{ anime: any; episodeId: string }[]>([]);

  useEffect(() => {
    const list = getContinueWatchingList();
    const resolved = list.map(item => ({
      anime: allAnime.find(a => a.id === item.animeId),
      episodeId: item.episodeId,
    })).filter(item => item.anime !== undefined);
    setContinueWatching(resolved);
  }, [allAnime]);

  return (
    <div className="flex flex-col gap-10 px-4 sm:px-6 max-w-7xl mx-auto pt-2 pb-16">
      {/* 1. CINEMATIC HERO SPOTLIGHT */}
      {heroAnime && (
        <section className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-white/[0.06]">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
            <img
              src={heroAnime.bannerUrl}
              alt={heroAnime.canonicalTitle}
              className="h-full w-full object-cover object-top opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-[#090A0F]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090A0F] via-[#090A0F]/70 to-transparent" />

            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 max-w-2xl">
              {/* Clean Metadata Line (No sparkle emoji, no glowing capsules) */}
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                <span>{heroAnime.mediaType}</span>
                <span>•</span>
                <span>{heroAnime.year}</span>
                <span>•</span>
                <span>{heroAnime.genres.slice(0, 3).join(', ')}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {heroAnime.canonicalTitle}
              </h1>

              <p className="mt-2.5 text-xs sm:text-sm text-zinc-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl">
                {heroAnime.synopsis}
              </p>

              {/* Action Buttons: Clean & Direct */}
              <div className="mt-6 flex items-center gap-3">
                <Link
                  href="/watch/ep-frieren-8"
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Tonton Sekarang</span>
                </Link>
                <Link
                  href={`/anime/${heroAnime.slug}`}
                  className="rounded-xl border border-white/[0.12] bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-200 hover:bg-white/[0.08] transition-colors"
                >
                  Detail Anime
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. CONTINUE WATCHING (JIKA ADA RIWAYAT) */}
      {continueWatching.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white">
              Lanjutkan Menonton
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {continueWatching.map(({ anime, episodeId }) => (
              <Link
                key={anime.id}
                href={`/watch/${episodeId}`}
                className="group flex flex-col gap-1.5"
              >
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.06]">
                  <img src={anime.bannerUrl} alt={anime.canonicalTitle} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-6 w-6 text-white fill-current" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-200 truncate">{anime.canonicalTitle}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. LATEST EPISODES / BARU TAYANG */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Update Terbaru
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Episode terbaru dengan takarir bahasa Indonesia
            </p>
          </div>
          <Link
            href="/anime"
            className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {allAnime.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </section>

      {/* 4. AD BANNER (CLEAN & MINIMAL) */}
      <SafeAdSlot slotKey="home_leaderboard" />

      {/* 5. POPULER MUSIM INI */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white">
            Populer Musim Ini
          </h2>
          <Link
            href="/anime"
            className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Jelajahi <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {allAnime.slice().reverse().map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </section>
    </div>
  );
}
