'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/services/store';
import { Clock, Play } from 'lucide-react';

interface ScheduleEntry {
  day: string;
  time: string;
  animeId: string;
  animeTitle: string;
  slug: string;
  episodeNumber: string;
  posterUrl: string;
  genres: string[];
}

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState('Jumat');

  const days = [
    { key: 'Senin', label: 'Senin' },
    { key: 'Selasa', label: 'Selasa' },
    { key: 'Rabu', label: 'Rabu' },
    { key: 'Kamis', label: 'Kamis' },
    { key: 'Jumat', label: 'Jumat', isToday: true },
    { key: 'Sabtu', label: 'Sabtu' },
    { key: 'Minggu', label: 'Minggu' },
  ];

  // Data jadwal mingguan realistis untuk seluruh hari
  const scheduleData: Record<string, ScheduleEntry[]> = {
    'Senin': [
      {
        day: 'Senin',
        time: '22:30 WIB',
        animeId: 'anime-windbreaker',
        animeTitle: 'Wind Breaker',
        slug: 'wind-breaker',
        episodeNumber: '02',
        posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&fit=crop',
        genres: ['Action', 'Delinquents'],
      },
    ],
    'Selasa': [
      {
        day: 'Selasa',
        time: '21:00 WIB',
        animeId: 'anime-oshinoko',
        animeTitle: 'Oshi no Ko Season 2',
        slug: 'oshi-no-ko-season-2',
        episodeNumber: '02',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&fit=crop',
        genres: ['Drama', 'Supernatural'],
      },
    ],
    'Rabu': [
      {
        day: 'Rabu',
        time: '22:00 WIB',
        animeId: 'anime-mushoku',
        animeTitle: 'Mushoku Tensei Season 2',
        slug: 'mushoku-tensei-season-2',
        episodeNumber: '12',
        posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&fit=crop',
        genres: ['Adventure', 'Fantasy'],
      },
    ],
    'Kamis': [
      {
        day: 'Kamis',
        time: '21:30 WIB',
        animeId: 'anime-dungeon',
        animeTitle: 'Dungeon Meshi',
        slug: 'dungeon-meshi',
        episodeNumber: '14',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&fit=crop',
        genres: ['Fantasy', 'Gourmet'],
      },
    ],
    'Jumat': [
      {
        day: 'Jumat',
        time: '21:00 WIB',
        animeId: 'anime-frieren',
        animeTitle: 'Sousou no Frieren',
        slug: 'sousou-no-frieren',
        episodeNumber: '08',
        posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&fit=crop',
        genres: ['Adventure', 'Fantasy'],
      },
      {
        day: 'Jumat',
        time: '23:30 WIB',
        animeId: 'anime-dungeon',
        animeTitle: 'Dungeon Meshi',
        slug: 'dungeon-meshi',
        episodeNumber: '02',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&fit=crop',
        genres: ['Gourmet', 'Fantasy'],
      },
    ],
    'Sabtu': [
      {
        day: 'Sabtu',
        time: '22:00 WIB',
        animeId: 'anime-kaiju8',
        animeTitle: 'Kaiju No. 8',
        slug: 'kaiju-no-8',
        episodeNumber: '11',
        posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&fit=crop',
        genres: ['Action', 'Sci-Fi'],
      },
      {
        day: 'Sabtu',
        time: '23:00 WIB',
        animeId: 'anime-sololeveling',
        animeTitle: 'Solo Leveling: Arise',
        slug: 'solo-leveling',
        episodeNumber: '12',
        posterUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&fit=crop',
        genres: ['Action', 'Fantasy'],
      },
    ],
    'Minggu': [
      {
        day: 'Minggu',
        time: '22:15 WIB',
        animeId: 'anime-hashira',
        animeTitle: 'Kimetsu no Yaiba: Hashira Geiko-hen',
        slug: 'kimetsu-no-yaiba-hashira-geiko-hen',
        episodeNumber: '07',
        posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&fit=crop',
        genres: ['Action', 'Historical'],
      },
    ],
  };

  const currentShows = scheduleData[selectedDay] || [];

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
          return (
            <button
              key={d.key}
              onClick={() => setSelectedDay(d.key)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:text-white'
              }`}
            >
              <span>{d.label}</span>
              {d.isToday && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                  isSelected ? 'bg-black/30 text-white' : 'bg-red-600/20 text-red-400'
                }`}>
                  Hari Ini
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Shows on selected day */}
      <div className="flex flex-col gap-3">
        {currentShows.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currentShows.map((show) => (
              <Link
                key={show.animeId}
                href={`/anime/${show.slug}`}
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-zinc-700 hover:bg-zinc-900/90 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={show.posterUrl}
                    alt={show.animeTitle}
                    className="h-16 w-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate group-hover:text-red-500 transition-colors">
                      {show.animeTitle}
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-0.5">
                      Episode {show.episodeNumber}
                    </span>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {show.time}
                    </span>
                  </div>
                </div>

                <div
                  className="p-2 rounded-lg bg-zinc-800 text-zinc-300 group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0 ml-2"
                  title="Buka detail anime"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-12 text-center text-xs text-zinc-500">
            Tidak ada jadwal rilis episode untuk hari {selectedDay}.
          </div>
        )}
      </div>
    </div>
  );
}
