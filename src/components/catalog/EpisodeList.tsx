'use client';

import Link from 'next/link';
import { Episode } from '@/types';
import { Play, Clock, AlertCircle, Check } from 'lucide-react';

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
        const isPlayable = ep.watchabilityState === 'eligible_verified';
        const isUpcoming = ep.airingState === 'scheduled';
        const hasSubIndo = ep.subtitleState === 'available';

        const content = (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isCurrent
                    ? 'bg-red-600 text-white'
                    : isPlayable
                    ? 'bg-zinc-800 text-zinc-300'
                    : 'bg-zinc-950 text-zinc-600'
                }`}
              >
                {ep.displayNumber}
              </span>

              <div className="flex flex-col min-w-0">
                <span className={`text-xs font-medium truncate ${
                  isPlayable ? 'text-zinc-200 group-hover:text-white' : 'text-zinc-500'
                }`}>
                  {ep.title}
                </span>

                <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                  <span className="text-zinc-500">Episode {ep.displayNumber}</span>
                  {hasSubIndo ? (
                    <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-1 rounded">
                      Sub Indo
                    </span>
                  ) : isUpcoming ? (
                    <span className="text-amber-400 font-semibold bg-amber-500/10 px-1 rounded flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      Segera Tayang
                    </span>
                  ) : (
                    <span className="text-zinc-500 bg-zinc-800 px-1 rounded">
                      Proses Subtitle
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pl-2 shrink-0">
              {isPlayable ? (
                <Play className="h-3.5 w-3.5 text-zinc-500 group-hover:text-red-500 transition-colors" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-zinc-600" />
              )}
            </div>
          </div>
        );

        if (isPlayable) {
          return (
            <Link
              key={ep.id}
              href={`/watch/${ep.id}`}
              className={`group flex items-center p-3 rounded-xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-red-600/10 border-red-500/40 text-white'
                  : 'bg-zinc-900/60 border-white/[0.06] hover:bg-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {content}
            </Link>
          );
        }

        return (
          <div
            key={ep.id}
            className="flex items-center p-3 rounded-xl border bg-zinc-950/40 border-white/[0.03] opacity-60 cursor-not-allowed"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
