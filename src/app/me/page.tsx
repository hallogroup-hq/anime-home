'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/services/store';
import { getLocalWatchlist, getLocalProgress, removeFromWatchlist } from '@/lib/services/watchlist';
import { AnimeCard } from '@/components/catalog/AnimeCard';
import { Bookmark, Download, Trash2, CheckCircle2, User, Film } from 'lucide-react';

export default function MePage() {
  const allAnime = db.getAnimeList();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'watching' | 'plan_to_watch' | 'completed'>('all');

  useEffect(() => {
    const rawList = getLocalWatchlist();
    const resolved = rawList.map(entry => {
      const anime = allAnime.find(a => a.id === entry.animeId);
      return anime ? { ...entry, anime } : null;
    }).filter(Boolean);
    setWatchlist(resolved);
  }, [allAnime]);

  const handleRemove = (animeId: string) => {
    removeFromWatchlist(animeId);
    setWatchlist(prev => prev.filter(item => item.animeId !== animeId));
  };

  const handleExportData = () => {
    const data = {
      watchlist: getLocalWatchlist(),
      progress: getLocalProgress(),
      exportedAt: new Date().toISOString(),
      platform: 'ANIME HOME',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animehome-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredItems = activeTab === 'all' 
    ? watchlist 
    : watchlist.filter(item => item.status === activeTab);

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 max-w-7xl mx-auto pt-4 pb-16">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface-900 border border-border-800">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white font-black text-xl shadow-lg shadow-brand/20">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">
              Tamu / Tamu Penonton (Penyimpanan Lokal Aktif)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Progres tontonan dan daftar pantau Anda tersimpan aman di browser Anda saat ini.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportData}
          className="flex items-center gap-2 rounded-2xl bg-surface-800 border border-border-700 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-surface-700 hover:text-white transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Ekspor Data Tontonan (JSON)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-800 pb-2">
        {[
          { key: 'all', label: `Semua (${watchlist.length})` },
          { key: 'watching', label: 'Sedang Ditonton' },
          { key: 'plan_to_watch', label: 'Ingin Ditonton' },
          { key: 'completed', label: 'Selesai' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
              activeTab === t.key
                ? 'bg-brand text-white'
                : 'text-slate-400 hover:text-white bg-surface-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Watchlist Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredItems.map(({ anime }) => (
            <div key={anime.id} className="relative group">
              <AnimeCard anime={anime} />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(anime.id);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-950/90 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-900 transition-opacity z-20 border border-red-500/40"
                title="Hapus dari Library"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-border-800 bg-surface-900/40 p-12 text-center flex flex-col items-center">
          <Bookmark className="h-10 w-10 text-slate-600 mb-2" />
          <h3 className="text-base font-bold text-white">Belum Ada Anime di Daftar Ini</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Buka katalog anime dan klik &quot;Tambah ke Watchlist&quot; untuk menyimpan judul tontonan Anda.
          </p>
          <Link
            href="/anime"
            className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-hover shadow-lg shadow-brand/20"
          >
            Jelajahi Katalog Anime
          </Link>
        </div>
      )}
    </div>
  );
}
