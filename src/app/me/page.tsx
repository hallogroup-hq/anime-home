'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/services/store';
import { getLocalWatchlist, getLocalProgress, removeFromWatchlist } from '@/lib/services/watchlist';
import { AnimeCard } from '@/components/catalog/AnimeCard';
import { Trash2, Download } from 'lucide-react';

export default function MePage() {
  const allAnime = db.getAnimeList();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'watching' | 'plan_to_watch' | 'completed'>('all');

  // Fixed: Empty dependency array [] prevents infinite re-render loop
  useEffect(() => {
    const rawList = getLocalWatchlist();
    const resolved = rawList.map(entry => {
      const anime = allAnime.find(a => a.id === entry.animeId);
      return anime ? { ...entry, anime } : null;
    }).filter(Boolean);
    setWatchlist(resolved);
  }, []);

  const handleRemove = (animeId: string) => {
    removeFromWatchlist(animeId);
    setWatchlist(prev => prev.filter(item => item.animeId !== animeId));
  };

  const handleExportData = () => {
    const data = {
      watchlist: getLocalWatchlist(),
      progress: getLocalProgress(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `koleksi-animehome-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredItems = activeTab === 'all' 
    ? watchlist 
    : watchlist.filter(item => item.status === activeTab);

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 max-w-7xl mx-auto pt-4 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Koleksi Saya
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Daftar anime dan episode yang Anda simpan.
          </p>
        </div>

        {watchlist.length > 0 && (
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor JSON</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 text-xs">
        {[
          { key: 'all', label: `Semua (${watchlist.length})` },
          { key: 'watching', label: 'Sedang Ditonton' },
          { key: 'plan_to_watch', label: 'Ingin Ditonton' },
          { key: 'completed', label: 'Selesai' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
              activeTab === t.key
                ? 'bg-white text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
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
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                title="Hapus dari koleksi"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-12 text-center text-xs text-zinc-500">
          Belum ada anime di daftar ini.{' '}
          <Link href="/anime" className="text-red-500 hover:underline ml-1">
            Jelajahi katalog
          </Link>
        </div>
      )}
    </div>
  );
}
