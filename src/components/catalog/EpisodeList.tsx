'use client';

import Link from 'next/link';
import { Episode } from '@/types';
import { Play } from 'lucide-react';

interface EpisodeListProps {
  episodes: Episode[];
  animeSlug: string;
  currentEpisodeId?: string;
}

export function EpisodeList({ episodes, animeSlug, currentEpisodeId }: EpisodeListProps) {
  if (episodes.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-6 text-center text-zinc-400 text-xs">
        Belum ada episode yang dirilis untuk judul ini.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {episodes.map((ep) => {
        const isCurrent = ep.id === currentEpisodeId;

        return (
          <Link
            key={ep.id}
            href={`/watch/${ep.id}`}
            className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
              isCurrent
                ? 'bg-red-600/10 border-red-500/40 text-white'
                : 'bg-zinc-900/60 border-white/[0.06] hover:bg-zinc-800/80 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isCurrent
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {ep.displayNumber}
              </span>

              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                  {ep.title}
                </span>
                <span className="text-[10px] text-zinc-500">
                  Episode {ep.displayNumber}
                </span>
              </div>
            </div>

            <div className="pl-2">
              <Play className="h-3.5 w-3.5 text-zinc-500 group-hover:text-red-500 transition-colors" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
