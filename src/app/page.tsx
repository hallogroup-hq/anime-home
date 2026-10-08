'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/services/store';
import { AnimeCard } from '@/components/catalog/AnimeCard';
import { SafeAdSlot } from '@/components/ads/SafeAdSlot';
import { getContinueWatchingList } from '@/lib/services/watchlist';
import { Play, Sparkles, Flame, Clock, Bookmark, ArrowRight, ShieldCheck } from 'lucide-react';

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
    <div className="flex flex-col gap-8 px-4 sm:px-6 max-w-7xl mx-auto pt-4">
      {/* 1. HERO SPOTLIGHT BANNER */}
      {heroAnime && (
        <section className="relative overflow-hidden rounded-3xl bg-surface-900 border border-border-800 shadow-2xl">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
            <img
              src={heroAnime.bannerUrl}
              alt={heroAnime.canonicalTitle}
              className="h-full w-full object-cover object-top opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/60 to-transparent" />

            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1 rounded-full bg-brand/20 border border-brand/40 px-3 py-1 text-xs font-bold text-brand">
                  <Sparkles className="h-3.5 w-3.5" />
                  Pilihan Utama Minggu Ini
                </span>
                <span className="rounded-full bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-400">
                  Sub Indo Lengkap
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {heroAnime.canonicalTitle}
              </h1>

              <p className="mt-2 text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                {heroAnime.synopsis}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href="/watch/ep-frieren-8"
                  className="flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-brand/30 hover:bg-brand-hover hover:scale-105 transition-all"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Tonton Episode 08 (Multi-Server)
                </Link>
                <Link
                  href={`/anime/${heroAnime.slug}`}
                  className="flex items-center gap-2 rounded-2xl border border-border-700 bg-surface-800/80 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-surface-700 transition-colors"
                >
                  Detail & Daftar Episode
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. CONTINUE WATCHING ROW (JIKA ADA RIWAYAT) */}
      {continueWatching.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-status-subIndo" />
              Lanjutkan Menonton
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {continueWatching.map(({ anime, episodeId }) => (
              <Link
                key={anime.id}
                href={`/watch/${episodeId}`}
                className="group relative flex flex-col rounded-2xl bg-surface-900 border border-border-800 p-2 hover:border-brand/50 transition-all"
              >
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-surface-800">
                  <img src={anime.bannerUrl} alt={anime.canonicalTitle} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <Play className="h-6 w-6 text-white fill-current" />
                  </div>
                </div>
                <span className="mt-2 text-xs font-bold text-white truncate">{anime.canonicalTitle}</span>
                <span className="text-[10px] text-brand font-medium">Klik untuk lanjut tonton</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. SAFE AD SLOT: HOME LEADERBOARD */}
      <SafeAdSlot slotKey="home_leaderboard" />

      {/* 4. BARU TAYANG & UPDATE SUB INDO (PRD J01 & FR-HOME) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-brand" />
              Baru Tayang & Terverifikasi Sub Indo
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sumber resmi dengan takarir bahasa Indonesia yang siap tonton
            </p>
          </div>
          <Link
            href="/anime"
            className="flex items-center gap-1 text-xs font-bold text-brand hover:underline"
          >
            Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {allAnime.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </section>

      {/* 5. JADWAL PENAYANGAN HARI INI */}
      <section className="rounded-3xl border border-border-800 bg-surface-900/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              Kalender Rilis Anime Indonesia (WIB)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau jadwal rilis mingguan dan pisahkan antara siaran Jepang vs ketersediaan Sub Indo.
            </p>
          </div>
        </div>
        <Link
          href="/schedule"
          className="rounded-xl border border-border-700 bg-surface-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-surface-700 transition-colors whitespace-nowrap"
        >
          Buka Jadwal Rilis Lengkap
        </Link>
      </section>
    </div>
  );
}
