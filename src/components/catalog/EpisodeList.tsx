'use client';

import Link from 'next/link';
import { Episode } from '@/types';
import { Play, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface EpisodeListProps {
  episodes: Episode[];
  animeSlug: string;
  currentEpisodeId?: string;
}

export function EpisodeList({ episodes, animeSlug, currentEpisodeId }: EpisodeListProps) {
  if (episodes.length === 0) {
    return (
      <div className="rounded-2xl border border-border-800 bg-surface-900/60 p-6 text-center text-slate-400 text-sm">
        Belum ada episode yang dirilis untuk judul ini.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {episodes.map((ep) => {
          const isCurrent = ep.id === currentEpisodeId;
          const isAired = ep.airingState === 'aired';
          const isPlayable = ep.watchabilityState === 'eligible_verified';
          const hasSubIndo = ep.subtitleState === 'available';

          return (
            <Link
              key={ep.id}
              href={`/watch/${ep.id}`}
              className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-brand/10 border-brand ring-1 ring-brand'
                  : 'bg-surface-900 border-border-800 hover:border-slate-600 hover:bg-surface-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm transition-transform group-hover:scale-105 ${
                    isCurrent
                      ? 'bg-brand text-white'
                      : 'bg-surface-800 text-slate-300 border border-border-700'
                  }`}
                >
                  {ep.displayNumber}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate group-hover:text-brand transition-colors">
                    {ep.title}
                  </span>
                  
                  {/* Tri-State Indicators Badges */}
                  <div className="flex items-center gap-2 mt-1">
                    {isPlayable ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Tersedia Putar
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-medium">
                        <Clock className="h-3 w-3" />
                        Jadwal Rilis
                      </span>
                    )}

                    {hasSubIndo && (
                      <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                        Sub Indo
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center pl-2">
                <div className="p-2 rounded-xl bg-surface-800 group-hover:bg-brand group-hover:text-white text-slate-400 transition-colors">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
