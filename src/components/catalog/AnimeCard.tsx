'use client';

import Link from 'next/link';
import { Anime } from '@/types';
import { Film, CheckCircle2 } from 'lucide-react';

interface AnimeCardProps {
  anime: Anime;
  priority?: boolean;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <Link
      href={`/anime/${anime.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface-900 border border-border-800 transition-all hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1"
    >
      {/* 2:3 Poster Frame */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-800">
        <img
          src={anime.posterUrl}
          alt={anime.canonicalTitle}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="rounded-md bg-ink-950/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
            {anime.mediaType}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-emerald-950/90 border border-emerald-500/30 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Sub Indo
          </span>
        </div>

        {/* Bottom Year / Period Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent p-2.5 pt-6">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
            <span>{anime.year}</span>
            <span>•</span>
            <span>{anime.seasonPeriod}</span>
          </div>
        </div>
      </div>

      {/* Title & Metadata */}
      <div className="flex flex-col p-3 flex-1 justify-between">
        <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-brand transition-colors">
          {anime.canonicalTitle}
        </h3>
        
        {/* Genre Tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          {anime.genres.slice(0, 2).map((g) => (
            <span
              key={g}
              className="rounded-md bg-surface-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
