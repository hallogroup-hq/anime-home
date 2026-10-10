'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/services/store';
import { EpisodeList } from '@/components/catalog/EpisodeList';
import { WatchOrderGuide } from '@/components/franchise/WatchOrderGuide';
import { FranchiseSeasonSwitcher } from '@/components/franchise/FranchiseSeasonSwitcher';
import { CharacterList } from '@/components/catalog/CharacterList';
import { SafeAdSlot } from '@/components/ads/SafeAdSlot';
import { EpisodeMerchShowcase } from '@/components/merch/EpisodeMerchShowcase';
import { setWatchlistStatus, getLocalWatchlist, removeFromWatchlist } from '@/lib/services/watchlist';
import { Play, Bookmark, Share2, Check, Film, Users, ListVideo, Clock, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AnimeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const anime = db.getAnimeBySlug(resolvedParams.slug);

  if (!anime) {
    notFound();
  }

  const episodes = db.getEpisodesByAnimeId(anime.id);
  const merchItems = db.getMerchByAnimeId(anime.id);
  const watchOrder = db.getWatchOrderForAnime(anime.id);
  const characters = db.getCharactersByAnimeId(anime.id);

  const [activeTab, setActiveTab] = useState<'episodes' | 'watch_order' | 'characters'>('episodes');
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const list = getLocalWatchlist();
    setIsInWatchlist(list.some(e => e.animeId === anime.id));
  }, [anime.id]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleWatchlist = () => {
    if (isInWatchlist) {
      removeFromWatchlist(anime.id);
      setIsInWatchlist(false);
    } else {
      setWatchlistStatus(anime.id, 'plan_to_watch');
      setIsInWatchlist(true);
    }
  };

  const firstPlayableEpisode = episodes.find(
    e => e.watchabilityState === 'eligible_verified' && db.getStreamMatrix(e.id).qualities.length > 0
  );

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
              {firstPlayableEpisode ? (
                <Link
                  href={`/watch/${firstPlayableEpisode.id}`}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Mulai Nonton</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-white/[0.08] px-4 py-2.5 text-xs font-semibold text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>Segera Tayang ({anime.scheduleWIB || 'Mendatang'})</span>
                </div>
              )}

              <button
                onClick={handleToggleWatchlist}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isInWatchlist
                    ? 'bg-zinc-800 border-white/[0.1] text-emerald-400'
                    : 'bg-zinc-900 border-white/[0.08] text-zinc-300 hover:text-white'
                }`}
              >
                <Bookmark className="h-4 w-4" />
                <span>{isInWatchlist ? 'Tersimpan' : 'Tambah ke Koleksi'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-zinc-900 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Salin tautan anime"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                <span>{copied ? 'Tersalin' : 'Bagikan'}</span>
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

        {/* Jadwal Tayang */}
        {anime.scheduleWIB && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-3.5 w-3.5" />
              <span>Jadwal Tayang: {anime.scheduleWIB}</span>
            </span>
          </div>
        )}

        {/* 4. AD BANNER */}
        <SafeAdSlot slotKey="anime_detail_inline" />

        {/* FRANCHISE SEASON & MOVIE SWITCHER */}
        {watchOrder.length > 1 && (
          <FranchiseSeasonSwitcher items={watchOrder} currentAnimeId={anime.id} />
        )}

        {/* 5. INTERACTIVE CONTENT TABS */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('episodes')}
              className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'episodes'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ListVideo className="h-4 w-4" />
              <span>Daftar Episode ({episodes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('watch_order')}
              className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'watch_order'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Film className="h-4 w-4 text-red-500" />
              <span>Urutan Nonton ({watchOrder.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('characters')}
              className={`flex items-center gap-2 py-2.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'characters'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="h-4 w-4 text-sky-400" />
              <span>Karakter & Seiyuu ({characters.length})</span>
            </button>
          </div>

          {/* TAB CONTENTS */}
          {activeTab === 'episodes' && (
            <EpisodeList episodes={episodes} animeSlug={anime.slug} />
          )}

          {activeTab === 'watch_order' && (
            <WatchOrderGuide items={watchOrder} currentAnimeId={anime.id} />
          )}

          {activeTab === 'characters' && (
            <CharacterList characters={characters} />
          )}
        </section>

        {/* 6. OFFICIAL MERCHANDISE DROPSHIP SHOWCASE */}
        <section className="pt-2">
          <EpisodeMerchShowcase animeId={anime.id} animeTitle={anime.canonicalTitle} />
        </section>
      </div>
    </div>
  );
}
