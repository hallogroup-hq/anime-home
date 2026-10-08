'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/services/store';
import { EpisodeList } from '@/components/catalog/EpisodeList';
import { SafeAdSlot } from '@/components/ads/SafeAdSlot';
import { setWatchlistStatus, getLocalWatchlist } from '@/lib/services/watchlist';
import { 
  Play, Bookmark, Share2, CheckCircle2, 
  Calendar, Layers, ShoppingBag, ExternalLink 
} from 'lucide-react';
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
      // Remove or set on hold
      setIsInWatchlist(false);
    } else {
      setWatchlistStatus(anime.id, 'plan_to_watch');
      setIsInWatchlist(true);
    }
  };

  const firstPlayableEpisode = episodes.find(e => e.watchabilityState === 'eligible_verified') || episodes[0];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* 1. HERO BACKDROP BANNER */}
      <div className="relative aspect-[21/9] sm:aspect-[24/8] w-full overflow-hidden bg-surface-900 border-b border-border-800">
        <img
          src={anime.bannerUrl}
          alt={anime.canonicalTitle}
          className="h-full w-full object-cover object-top opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent" />
      </div>

      <div className="px-4 sm:px-6 max-w-7xl mx-auto w-full -mt-20 sm:-mt-28 relative z-10 flex flex-col gap-8">
        {/* 2. MAIN HEADER & POSTER CONTAINER */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Poster Card */}
          <div className="w-36 sm:w-52 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-surface-800 border-2 border-border-700 shadow-2xl">
            <img src={anime.posterUrl} alt={anime.canonicalTitle} className="h-full w-full object-cover" />
          </div>

          {/* Title & Metadata Details */}
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-brand/20 border border-brand/40 px-2.5 py-1 text-xs font-bold text-brand uppercase">
                {anime.mediaType}
              </span>
              <span className="rounded-lg bg-surface-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                {anime.year} • {anime.seasonPeriod}
              </span>
              <span className="rounded-lg bg-surface-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                {anime.maturityRating}
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-emerald-950 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Sub Indo Terverifikasi
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {anime.canonicalTitle}
            </h1>

            {/* Aliases List (PRD FR-CAT) */}
            {anime.aliases && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                {anime.aliases.map((alt) => (
                  <span key={alt.id}>
                    <span className="text-slate-500 uppercase text-[10px] mr-1">{alt.titleType}:</span>
                    {alt.title}
                  </span>
                ))}
              </div>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {anime.genres.map((g) => (
                <span key={g} className="rounded-lg bg-surface-800 border border-border-800 px-2.5 py-1 text-xs text-slate-300">
                  {g}
                </span>
              ))}
            </div>

            {/* Action Buttons (Watch CTA + Watchlist) */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {firstPlayableEpisode && (
                <Link
                  href={`/watch/${firstPlayableEpisode.id}`}
                  className="flex items-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-brand/30 hover:bg-brand-hover hover:scale-105 transition-all"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Tonton Episode {firstPlayableEpisode.displayNumber}
                </Link>
              )}

              <button
                onClick={handleToggleWatchlist}
                className={`flex items-center gap-2 rounded-2xl border px-5 py-3.5 text-sm font-semibold transition-colors ${
                  isInWatchlist
                    ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                    : 'bg-surface-800 border-border-700 text-slate-200 hover:bg-surface-700'
                }`}
              >
                <Bookmark className="h-4 w-4" />
                {isInWatchlist ? 'Tersimpan di Library' : 'Tambah ke Watchlist'}
              </button>
            </div>
          </div>
        </div>

        {/* 3. SYNOPSIS */}
        <section className="flex flex-col gap-2 rounded-3xl bg-surface-900 border border-border-800 p-5 sm:p-6">
          <h2 className="text-base font-extrabold text-white">Sinopsis Resmi</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {anime.synopsis}
          </p>
        </section>

        {/* 4. SAFE INLINE ADVERTISEMENT */}
        <SafeAdSlot slotKey="anime_detail_inline" />

        {/* 5. EPISODES LIST & TRI-STATE INDICATORS */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border-800 pb-3">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-brand" />
                Daftar Episode ({episodes.length} Episode)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih episode untuk membuka pilihan resolusi dan multi-server.
              </p>
            </div>
          </div>

          <EpisodeList episodes={episodes} animeSlug={anime.slug} />
        </section>

        {/* 6. RELATED MERCHANDISE DISCOVERY (PRD FR-MERCH) */}
        {merchItems.length > 0 && (
          <section className="flex flex-col gap-4 rounded-3xl bg-surface-900 border border-border-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  Merchandise & Koleksi Resmi Terkait
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Toko Mitra Terverifikasi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {merchItems.map((item) => (
                <a
                  key={item.id}
                  href={item.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-ink-950 border border-border-700 hover:border-amber-500/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                      <span className="text-[10px] text-slate-500">{item.storeName}</span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-white" />
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
