'use client';

import Link from 'next/link';
import { Anime } from '@/types';

interface AnimeCardProps {
  anime: Anime;
  priority?: boolean;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <Link
      href={`/anime/${anime.slug}`}
      className="group flex flex-col gap-2 transition-transform duration-200"
    >
      {/* 2:3 Poster Frame */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 border border-white/[0.06]">
        <img
          src={anime.posterUrl}
          alt={anime.canonicalTitle}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Discrete Top Tags */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
          <span className="rounded bg-black/75 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
            {anime.mediaType}
          </span>
          <span className="rounded bg-black/75 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
            SUB
          </span>
        </div>

        {/* Bottom Year Indicator */}
        <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
          <span className="rounded bg-black/75 px-1.5 py-0.5 text-[10px] text-zinc-400">
            {anime.year}
          </span>
        </div>
      </div>

      {/* Title & Genres */}
      <div className="flex flex-col gap-0.5 px-0.5">
        <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 line-clamp-1 group-hover:text-red-500 transition-colors">
          {anime.canonicalTitle}
        </h3>
        <p className="text-[11px] text-zinc-500 line-clamp-1">
          {anime.genres.slice(0, 2).join(' • ')}
        </p>
      </div>
    </Link>
  );
}
