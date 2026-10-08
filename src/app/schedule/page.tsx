'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SchedulePage() {
  const allAnime = db.getAnimeList();
  const [selectedDay, setSelectedDay] = useState('Semua');

  const days = ['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 max-w-7xl mx-auto pt-4 pb-16">
      <div>
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-brand" />
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            Jadwal Rilis Anime (Waktu Indonesia Barat)
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Jadwal otomatis disesuaikan ke zona waktu Indonesia (WIB). Status penayangan di Jepang dipisahkan secara tegas dari ketersediaan subtitle Indonesia.
        </p>
      </div>

      {/* Day Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-border-800">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
              selectedDay === day
                ? 'bg-brand text-white shadow-md shadow-brand/20'
                : 'bg-surface-900 border border-border-700 text-slate-400 hover:text-white'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule Items */}
      <div className="flex flex-col gap-3">
        {allAnime.map((anime) => (
          <div
            key={anime.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-900 border border-border-800 hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-3.5">
              <img src={anime.posterUrl} alt={anime.canonicalTitle} className="h-16 w-12 rounded-xl object-cover shrink-0" />
              <div>
                <Link href={`/anime/${anime.slug}`} className="text-sm font-bold text-white hover:text-brand transition-colors">
                  {anime.canonicalTitle}
                </Link>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-500" />
                    21:30 WIB
                  </span>
                  <span>•</span>
                  <span>{anime.mediaType}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Sub Indo Siap Tonton
              </span>
              <Link
                href={`/anime/${anime.slug}`}
                className="rounded-xl bg-surface-800 border border-border-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-surface-700"
              >
                Lihat Episode
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
