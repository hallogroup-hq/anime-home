'use client';

import Link from 'next/link';
import { Anime } from '@/types';
import { Play } from 'lucide-react';

interface AnimeCardProps {
  anime: Anime;
  priority?: boolean;
  badge?: string;
  subtitle?: string;
  href?: string;
}

export function AnimeCard({ anime, badge, subtitle, href }: AnimeCardProps) {
  const targetHref = href || `/anime/${anime.slug}`;
  const dayName = anime.scheduleWIB?.split(',')[0]?.trim();

  return (
    <div className="group flex flex-col gap-2 transition-transform duration-200">
      {/* 2:3 Poster Frame */}
      <Link
        href={targetHref}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 border border-white/[0.08] block cursor-pointer group"
      >
        <img
          src={anime.posterUrl}
          alt={anime.canonicalTitle}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Discrete Top Left Tags */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none z-10">
          <span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
            {anime.mediaType}
          </span>
          <span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
            SUB
          </span>
        </div>

        {/* Top Right Schedule / Episode Badge */}
        {badge && (
          <div className="absolute top-2 right-2 pointer-events-none z-10">
            <span className="rounded bg-red-600/95 text-white font-bold px-2 py-0.5 text-[10px] shadow-lg shadow-red-950/50">
              {badge}
            </span>
          </div>
        )}

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40 transform group-hover:scale-110 transition-transform">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Bottom Schedule / Year Indicator */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <span className="rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
            {dayName ? `Hari ${dayName}` : anime.year}
          </span>
          {anime.airingStatus === 'airing' && (
            <span className="rounded bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              Ongoing
            </span>
          )}
        </div>
      </Link>

      {/* Title & Genres / Schedule */}
      <div className="flex flex-col gap-0.5 px-0.5">
        <Link
          href={targetHref}
          className="text-xs sm:text-sm font-semibold text-zinc-100 line-clamp-1 hover:text-red-500 transition-colors cursor-pointer"
        >
          {anime.canonicalTitle}
        </Link>
        <p className="text-[11px] text-zinc-400 line-clamp-1">
          {subtitle || (dayName ? `Update setiap ${dayName}` : anime.genres.slice(0, 2).join(' • '))}
        </p>
      </div>
    </div>
  );
}
