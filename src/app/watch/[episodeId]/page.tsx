'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/services/store';
import { MultiProviderPlayer } from '@/components/player/MultiProviderPlayer';
import { EpisodeDiscussion } from '@/components/player/EpisodeDiscussion';
import { SafeAdSlot } from '@/components/ads/SafeAdSlot';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Share2, Check } from 'lucide-react';

export default function WatchPage({ params }: { params: Promise<{ episodeId: string }> }) {
  const resolvedParams = use(params);
  const episode = db.getEpisodeById(resolvedParams.episodeId);
  const [copied, setCopied] = useState(false);

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

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-5 px-4 sm:px-6 max-w-5xl mx-auto pt-3 pb-16">
      {/* Top Breadcrumb & Episode Badge */}
      <div className="flex items-center justify-between">
        <Link
          href={`/anime/${anime.slug}`}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke {anime.canonicalTitle}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white bg-zinc-900 border border-white/[0.08] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            title="Salin tautan video"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Share2 className="h-3 w-3" />}
            <span>{copied ? 'Tersalin' : 'Bagikan'}</span>
          </button>
          <span className="text-xs font-bold text-zinc-300 bg-zinc-900 border border-white/[0.08] px-2.5 py-1 rounded-lg">
            Episode {episode.displayNumber}
          </span>
        </div>
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
        nextEpisodeId={nextEpisode && nextEpisode.watchabilityState === 'eligible_verified' ? nextEpisode.id : undefined}
        nextEpisodeNumber={nextEpisode?.displayNumber}
      />

      {/* QUICK EPISODE SELECTOR */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300">Daftar Episode:</span>
          <Link href={`/anime/${anime.slug}`} className="hover:text-white transition-colors">
            Semua ({allEpisodes.length})
          </Link>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {allEpisodes.map((ep) => {
            const isCurrent = ep.id === episode.id;
            const isPlayable = ep.watchabilityState === 'eligible_verified';
            return (
              <Link
                key={ep.id}
                href={isPlayable ? `/watch/${ep.id}` : '#'}
                className={`flex items-center justify-center min-w-[42px] h-9 px-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-red-600 text-white shadow-sm'
                    : isPlayable
                    ? 'bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    : 'bg-zinc-950 border border-white/[0.04] text-zinc-600 cursor-not-allowed'
                }`}
                title={ep.title}
              >
                {ep.displayNumber}
              </Link>
            );
          })}
        </div>
      </div>

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

        {nextEpisode && nextEpisode.watchabilityState === 'eligible_verified' ? (
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

      {/* SPOILER-MASKED EPISODE DISCUSSION FEED */}
      <EpisodeDiscussion
        episodeId={episode.id}
        episodeNumber={episode.displayNumber}
      />
    </div>
  );
}
