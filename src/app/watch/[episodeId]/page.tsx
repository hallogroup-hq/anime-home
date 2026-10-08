'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/services/store';
import { MultiProviderPlayer } from '@/components/player/MultiProviderPlayer';
import { SafeAdSlot } from '@/components/ads/SafeAdSlot';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

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
    <div className="flex flex-col gap-5 px-4 sm:px-6 max-w-5xl mx-auto pt-3 pb-16">
      {/* Top Breadcrumb & Episode Badge */}
      <div className="flex items-center justify-between">
        <Link
          href={`/anime/${anime.slug}`}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke {anime.canonicalTitle}</span>
        </Link>
        <span className="text-xs font-bold text-zinc-300 bg-zinc-900 border border-white/[0.08] px-2.5 py-1 rounded-lg">
          Episode {episode.displayNumber}
        </span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-lg sm:text-2xl font-black text-white">
          {anime.canonicalTitle}: Episode {episode.displayNumber}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          {episode.title}
        </p>
      </div>

      {/* CORE PLAYER WITH INTEGRATED RESOLUTION & SERVER SELECTOR */}
      <MultiProviderPlayer
        episodeId={episode.id}
        animeId={anime.id}
        animeTitle={anime.canonicalTitle}
        episodeNumber={episode.displayNumber}
        episodeTitle={episode.title}
      />

      {/* NEXT / PREV EPISODE BUTTONS */}
      <div className="flex items-center justify-between py-2 border-y border-white/[0.06]">
        {prevEpisode ? (
          <Link
            href={`/watch/${prevEpisode.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Episode {prevEpisode.displayNumber}</span>
          </Link>
        ) : (
          <div />
        )}

        {nextEpisode ? (
          <Link
            href={`/watch/${nextEpisode.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors ml-auto shadow-sm"
          >
            <span>Episode Selanjutnya ({nextEpisode.displayNumber})</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* DISCRETE AD BANNER */}
      <SafeAdSlot slotKey="watch_below_controls" />
    </div>
  );
}
