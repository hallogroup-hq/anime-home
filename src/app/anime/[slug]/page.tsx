'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/services/store';
import { EpisodeList } from '@/components/catalog/EpisodeList';
import { SafeAdSlot } from '@/components/ads/SafeAdSlot';
import { setWatchlistStatus, getLocalWatchlist, removeFromWatchlist } from '@/lib/services/watchlist';
import { Play, Bookmark, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AnimeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const anime = db.getAnimeBySlug(resolvedParams.slug);

  if (!anime) {
    notFound();
  }

  const episodes = db.getEpisodesByAnimeId(anime.id);
  const merchItems = db.getMerchByAnimeId(anime.id);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    const list = getLocalWatchlist();
    setIsInWatchlist(list.some(e => e.animeId === anime.id));
  }, [anime.id]);

  const handleToggleWatchlist = () => {
    if (isInWatchlist) {
      removeFromWatchlist(anime.id);
      setIsInWatchlist(false);
    } else {
      setWatchlistStatus(anime.id, 'plan_to_watch');
      setIsInWatchlist(true);
    }
  };

  const firstPlayableEpisode = episodes.find(e => e.watchabilityState === 'eligible_verified') || episodes[0];

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* 1. HERO BACKDROP */}
      <div className="relative aspect-[21/9] sm:aspect-[24/7] w-full overflow-hidden bg-zinc-950 border-b border-white/[0.06]">
        <img
          src={anime.bannerUrl}
          alt={anime.canonicalTitle}
          className="h-full w-full object-cover object-top opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-[#090A0F]/50 to-transparent" />
      </div>

      <div className="px-4 sm:px-6 max-w-7xl mx-auto w-full -mt-24 sm:-mt-32 relative z-10 flex flex-col gap-8">
        {/* 2. POSTER & ESSENTIAL INFO */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-36 sm:w-48 shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.1] shadow-2xl">
            <img src={anime.posterUrl} alt={anime.canonicalTitle} className="h-full w-full object-cover" />
          </div>

          <div className="flex flex-col gap-2.5 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="font-semibold text-white">{anime.mediaType}</span>
              <span>•</span>
              <span>{anime.year}</span>
              <span>•</span>
              <span>{anime.seasonPeriod}</span>
              <span>•</span>
              <span>{anime.maturityRating}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {anime.canonicalTitle}
            </h1>

            {/* Aliases */}
            {anime.aliases && (
              <div className="flex flex-wrap gap-x-3 text-xs text-zinc-400">
                {anime.aliases.map((alt) => (
                  <span key={alt.id}>
                    <span className="text-zinc-500 mr-1 uppercase text-[10px]">{alt.titleType}:</span>
                    {alt.title}
                  </span>
                ))}
              </div>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {anime.genres.map((g) => (
                <span key={g} className="rounded-md bg-zinc-900 border border-white/[0.08] px-2 py-0.5 text-xs text-zinc-300">
                  {g}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {firstPlayableEpisode && (
                <Link
                  href={`/watch/${firstPlayableEpisode.id}`}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Mulai Nonton</span>
                </Link>
              )}

              <button
                onClick={handleToggleWatchlist}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors ${
                  isInWatchlist
                    ? 'bg-zinc-800 border-white/[0.1] text-emerald-400'
                    : 'bg-zinc-900 border-white/[0.08] text-zinc-300 hover:text-white'
                }`}
              >
                <Bookmark className="h-4 w-4" />
                <span>{isInWatchlist ? 'Tersimpan' : 'Tambah ke Koleksi'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. SYNOPSIS */}
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400">Sinopsis</h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
            {anime.synopsis}
          </p>
        </section>

        {/* 4. AD BANNER */}
        <SafeAdSlot slotKey="anime_detail_inline" />

        {/* 5. EPISODES LIST */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-white">
            Episode ({episodes.length})
          </h2>
          <EpisodeList episodes={episodes} animeSlug={anime.slug} />
        </section>

        {/* 6. MERCHANDISE IF ANY */}
        {merchItems.length > 0 && (
          <section className="flex flex-col gap-3 pt-4 border-t border-white/[0.06]">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              Merchandise Terkait
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {merchItems.map((item) => (
                <a
                  key={item.id}
                  href={item.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06] hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                      <p className="text-xs text-zinc-400 font-medium mt-0.5">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
