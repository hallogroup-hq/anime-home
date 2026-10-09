'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/services/store';
import { AnimeCard } from '@/components/catalog/AnimeCard';
import { SafeAdSlot } from '@/components/ads/SafeAdSlot';
import { getContinueWatchingList } from '@/lib/services/watchlist';
import { Play, ChevronRight, Calendar, Sparkles } from 'lucide-react';

export default function HomePage() {
  const allAnime = db.getAnimeList();
  const cmsConfig = db.getHomepageConfig();
  const [continueWatching, setContinueWatching] = useState<{ anime: any; episodeId: string }[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Semua');

  // Day order priority based on current day and update cycle (Sabtu -> Jumat -> Kamis -> Rabu -> Selasa -> Senin -> Minggu)
  const DAY_ORDER: Record<string, number> = {
    'Sabtu': 1,
    'Jumat': 2,
    'Kamis': 3,
    'Rabu': 4,
    'Selasa': 5,
    'Senin': 6,
    'Minggu': 7,
    'Berkala': 8,
  };

  const ongoingAnime = allAnime
    .filter(a => a.airingStatus === 'airing')
    .sort((a, b) => {
      const dayA = a.scheduleWIB?.split(',')[0]?.trim() || '';
      const dayB = b.scheduleWIB?.split(',')[0]?.trim() || '';
      const weightA = DAY_ORDER[dayA] || 99;
      const weightB = DAY_ORDER[dayB] || 99;
      return weightA - weightB;
    });

  // Hero anime dynamically follows the latest updated ongoing anime
  const heroAnime = ongoingAnime[0] || allAnime[0];

  const filteredOngoing = selectedDay === 'Semua'
    ? ongoingAnime
    : ongoingAnime.filter(a => a.scheduleWIB?.includes(selectedDay));

  const completedAnime = allAnime.filter(a => a.airingStatus === 'completed');

  // Empty dependency array [] prevents infinite re-render loop on client mount
  useEffect(() => {
    const list = getContinueWatchingList();
    const resolved = list.map(item => ({
      anime: allAnime.find(a => a.id === item.animeId),
      episodeId: item.episodeId,
    })).filter(item => item.anime !== undefined);
    setContinueWatching(resolved);
  }, []);

  // Section render map for Visual CMS
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        if (!heroAnime) return null;
        return (
          <section key="hero" className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-white/[0.08] shadow-2xl">
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
              <img
                src={heroAnime.bannerUrl}
                alt={heroAnime.canonicalTitle}
                className="h-full w-full object-cover object-top opacity-50 select-none pointer-events-none"
              />
              {/* Gradients are strictly pointer-events-none so they never block user clicks */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-[#090A0F]/60 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#090A0F] via-[#090A0F]/70 to-transparent pointer-events-none" />

              {/* Content overlay with explicit pointer-events-auto and z-index */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 z-10 pointer-events-none">
                <div className="max-w-2xl pointer-events-auto">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                    <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      {heroAnime.airingStatus === 'airing' ? 'Update Terbaru' : 'Populer'}
                    </span>
                    <span>•</span>
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

                  {/* Action Buttons: Explicit click targets */}
                  <div className="mt-6 flex items-center gap-3 relative z-20">
                    {(() => {
                      const heroEpisodes = db.getEpisodesByAnimeId(heroAnime.id);
                      const firstEp = heroEpisodes.find(
                        e => e.watchabilityState === 'eligible_verified' && db.getStreamMatrix(e.id).qualities.length > 0
                      );
                      const watchHref = firstEp ? `/watch/${firstEp.id}` : `/anime/${heroAnime.slug}`;
                      return (
                        <Link
                          href={watchHref}
                          className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/30 cursor-pointer"
                        >
                          <Play className="h-4 w-4 fill-current" />
                          <span>Tonton Sekarang</span>
                        </Link>
                      );
                    })()}
                    <Link
                      href={`/anime/${heroAnime.slug}`}
                      className="rounded-xl border border-white/[0.15] bg-zinc-900/80 hover:bg-zinc-800 active:scale-95 px-5 py-3 text-sm font-medium text-zinc-200 transition-all cursor-pointer"
                    >
                      Detail Anime
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'latest_episodes':
        return (
          <section key="latest_episodes" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Ongoing
                </h2>
              </div>
              <Link
                href="/schedule"
                className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Jadwal Lengkap <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Day Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => {
                const count = day === 'Semua'
                  ? ongoingAnime.length
                  : ongoingAnime.filter(a => a.scheduleWIB?.includes(day)).length;
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                        : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/[0.08]'
                    }`}
                  >
                    {day} <span className={`ml-1 text-[10px] ${isSelected ? 'text-red-200' : 'text-zinc-500'}`}>({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredOngoing.map((anime) => {
                const eps = db.getEpisodesByAnimeId(anime.id);
                const latestEp = eps.length > 0 ? eps[eps.length - 1] : null;
                const epNum = latestEp?.title?.match(/Episode\s+(\d+)/i)?.[1] || latestEp?.displayNumber || '1';
                const dayName = anime.scheduleWIB?.split(',')[0]?.trim() || 'Baru';

                return (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    badge={`${dayName} • Ep ${epNum}`}
                    subtitle={`Episode ${epNum} Subtitle Indonesia`}
                    href={latestEp ? `/watch/${latestEp.id}` : `/anime/${anime.slug}`}
                  />
                );
              })}
            </div>
          </section>
        );

      case 'continue_watching':
        if (continueWatching.length === 0) return null;
        return (
          <section key="continue_watching" className="flex flex-col gap-3">
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
                  className="group flex flex-col gap-1.5 cursor-pointer"
                >
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.08]">
                    <img src={anime.bannerUrl} alt={anime.canonicalTitle} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-6 w-6 text-white fill-current" />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-200 truncate group-hover:text-red-500 transition-colors">{anime.canonicalTitle}</span>
                </Link>
              ))}
            </div>
          </section>
        );

      case 'ad_banner':
        return <SafeAdSlot key="ad_banner" slotKey="home_leaderboard" />;

      case 'popular':
        return (
          <section key="popular" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Koleksi Populer & Selesai (Completed)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Serial tamat dengan musim lengkap, verified player, dan takarir Indonesia
                </p>
              </div>
              <Link
                href="/anime?status=completed"
                className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {completedAnime.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-10 px-4 sm:px-6 max-w-7xl mx-auto pt-4 pb-20">
      {cmsConfig.sections
        .filter(s => s.enabled)
        .map(s => renderSection(s.id))}
    </div>
  );
}
