'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Anime, Episode } from '@/types';
import { Clock, Play, Calendar } from 'lucide-react';

interface ScheduleClientProps {
  ongoingAnime: Array<{
    anime: Anime;
    latestEpisode: Episode | null;
  }>;
}

export function ScheduleClient({ ongoingAnime }: ScheduleClientProps) {
  const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayName = DAY_NAMES[new Date().getDay()] || 'Jumat';
  const [selectedDay, setSelectedDay] = useState<string>(todayName);

  const days = [
    { key: 'Semua', label: 'Semua Hari' },
    { key: 'Senin', label: 'Senin', isToday: todayName === 'Senin' },
    { key: 'Selasa', label: 'Selasa', isToday: todayName === 'Selasa' },
    { key: 'Rabu', label: 'Rabu', isToday: todayName === 'Rabu' },
    { key: 'Kamis', label: 'Kamis', isToday: todayName === 'Kamis' },
    { key: 'Jumat', label: 'Jumat', isToday: todayName === 'Jumat' },
    { key: 'Sabtu', label: 'Sabtu', isToday: todayName === 'Sabtu' },
    { key: 'Minggu', label: 'Minggu', isToday: todayName === 'Minggu' },
  ];

  const displayedAnime = selectedDay === 'Semua'
    ? ongoingAnime
    : ongoingAnime.filter(({ anime }) => anime.scheduleWIB?.includes(selectedDay));

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 max-w-7xl mx-auto pt-4 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white">
          Jadwal Rilis Anime
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
          Waktu penayangan otomatis dalam zona Waktu Indonesia Barat (WIB).
        </p>
      </div>

      {/* Day Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/[0.06]">
        {days.map((d) => {
          const isSelected = selectedDay === d.key;
          const count = d.key === 'Semua'
            ? ongoingAnime.length
            : ongoingAnime.filter(({ anime }) => anime.scheduleWIB?.includes(d.key)).length;

          return (
            <button
              key={d.key}
              onClick={() => setSelectedDay(d.key)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>{d.label}</span>
              <span className={`text-[10px] ${isSelected ? 'text-red-200' : 'text-zinc-500'}`}>
                ({count})
              </span>
              {d.isToday && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                  isSelected ? 'bg-black/30 text-white' : 'bg-red-600/20 text-red-400'
                }`}>
                  Hari Ini
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Shows Grid */}
      <div className="flex flex-col gap-3">
        {displayedAnime.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedAnime.map(({ anime, latestEpisode }) => {
              const epNum = latestEpisode?.title?.match(/Episode\s+(\d+)/i)?.[1] || latestEpisode?.displayNumber || '1';
              const watchHref = latestEpisode ? `/watch/${latestEpisode.id}` : `/anime/${anime.slug}`;
              const dayPart = anime.scheduleWIB?.split(',')[0]?.trim() || '';
              const timePart = anime.scheduleWIB?.split(',')[1]?.trim() || anime.scheduleWIB || '20:00 WIB';

              return (
                <div
                  key={anime.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-zinc-700 hover:bg-zinc-900/90 transition-all group"
                >
                  <Link
                    href={`/anime/${anime.slug}`}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <img
                      src={anime.posterUrl}
                      alt={anime.canonicalTitle}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect width="300" height="450" fill="%2318181b"/><text x="50%" y="50%" fill="%2371717a" font-size="14" font-family="sans-serif" text-anchor="middle">ANIME HOME</text></svg>';
                      }}
                      className="h-16 w-12 rounded-lg object-cover shrink-0 bg-zinc-800"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate group-hover:text-red-500 transition-colors">
                        {anime.canonicalTitle}
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-0.5">
                        Episode {epNum} Subtitle Indonesia
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3 text-red-500" />
                          {dayPart ? `${dayPart}, ${timePart}` : timePart}
                        </span>
                        <span className="text-[9px] bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.2 rounded font-semibold">
                          Ongoing
                        </span>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={watchHref}
                    className="p-2.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-red-600 hover:text-white transition-all shrink-0 ml-2 cursor-pointer shadow-sm group-hover:bg-red-600 group-hover:text-white"
                    title={`Tonton Episode ${epNum}`}
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-12 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
            <Calendar className="h-8 w-8 text-zinc-600" />
            <span>Tidak ada jadwal rilis episode untuk hari {selectedDay}.</span>
          </div>
        )}
      </div>
    </div>
  );
}
