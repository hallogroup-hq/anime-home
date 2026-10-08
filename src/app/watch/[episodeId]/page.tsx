'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/services/store';
import { MultiProviderPlayer } from '@/components/player/MultiProviderPlayer';
import { SafeAdSlot } from '@/components/ads/SafeAdSlot';
import { ChevronLeft, ChevronRight, Film, Info, ArrowLeft } from 'lucide-react';

export default function WatchPage({ params }: { params: Promise<{ episodeId: string }> }) {
  const resolvedParams = use(params);
  const episode = db.getEpisodeById(resolvedParams.episodeId);

  if (!episode) {
    notFound();
  }

  const anime = db.getAnimeList().find(a => a.id === episode.animeId);
  if (!anime) {
    notFound();
  }

  const allEpisodes = db.getEpisodesByAnimeId(anime.id);
  const currentIndex = allEpisodes.findIndex(e => e.id === episode.id);
  const prevEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 max-w-6xl mx-auto pt-3 pb-16">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/anime/${anime.slug}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Detail {anime.canonicalTitle}</span>
        </Link>
        <span className="text-xs text-brand font-bold bg-brand/10 border border-brand/30 px-2.5 py-0.5 rounded-lg">
          Episode {episode.displayNumber}
        </span>
      </div>

      {/* Title & Metadata */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white">
          {anime.canonicalTitle} — Episode {episode.displayNumber}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
          {episode.title}
        </p>
      </div>

      {/* CORE MULTI-PROVIDER PLAYER (INVARIANT DEFINING) */}
      <MultiProviderPlayer
        episodeId={episode.id}
        animeId={anime.id}
        animeTitle={anime.canonicalTitle}
        episodeNumber={episode.displayNumber}
        episodeTitle={episode.title}
      />

      {/* NEXT / PREV EPISODE CONTROLS */}
      <div className="flex items-center justify-between border-y border-border-800 py-3">
        {prevEpisode ? (
          <Link
            href={`/watch/${prevEpisode.id}`}
            className="flex items-center gap-2 rounded-xl bg-surface-900 border border-border-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Episode Sebelumnya ({prevEpisode.displayNumber})</span>
          </Link>
        ) : (
          <span className="text-xs text-slate-600">Episode Pertama</span>
        )}

        {nextEpisode ? (
          <Link
            href={`/watch/${nextEpisode.id}`}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-hover shadow-lg shadow-brand/20 transition-all"
          >
            <span>Episode Selanjutnya ({nextEpisode.displayNumber})</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="text-xs text-slate-600">Episode Terakhir</span>
        )}
      </div>

      {/* SAFE AD SLOT: BELOW PLAYER CONTROLS (PRD 13.2) */}
      <SafeAdSlot slotKey="watch_below_controls" />

      {/* SINOPSIS & EPISODE BROWSER */}
      <div className="rounded-3xl bg-surface-900 border border-border-800 p-5 flex flex-col gap-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400" />
          Tentang Episode Ini
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {anime.synopsis}
        </p>
      </div>
    </div>
  );
}
