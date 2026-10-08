'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/services/store';
import { getLocalWatchlist, getLocalProgress, removeFromWatchlist, clearAllWatchlist } from '@/lib/services/watchlist';
import { AnimeCard } from '@/components/catalog/AnimeCard';
import { AuthModal } from '@/components/auth/AuthModal';
import { Trash2, Download, Cloud, User, LogIn, Check, Sparkles } from 'lucide-react';
import { UserProfile } from '@/types';

export default function MePage() {
  const allAnime = db.getAnimeList();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'watching' | 'plan_to_watch' | 'completed'>('all');
  const [user, setUser] = useState<UserProfile>(() => db.getUserProfile());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = () => {
    const rawList = getLocalWatchlist();
    const resolved = rawList.map(entry => {
      const anime = allAnime.find(a => a.id === entry.animeId);
      return anime ? { ...entry, anime } : null;
    }).filter(Boolean);
    setWatchlist(resolved);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemove = (animeId: string) => {
    removeFromWatchlist(animeId);
    setWatchlist(prev => prev.filter(item => item.animeId !== animeId));
  };

  const handleClearAll = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh koleksi anime tersimpan?')) {
      clearAllWatchlist();
      setWatchlist([]);
      setNotice('Seluruh koleksi telah dikosongkan.');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleExportData = () => {
    const data = {
      watchlist: getLocalWatchlist(),
      progress: getLocalProgress(),
      user: db.getUserProfile(),
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
      {/* Top Header & Cloud Sync Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Koleksi Saya
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Daftar anime dan riwayat tontonan yang tersimpan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {watchlist.length > 0 && (
            <>
              <button
                onClick={handleExportData}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Ekspor JSON</span>
              </button>

              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Kosongkan</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsAuthOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              user.isLoggedIn
                ? 'bg-zinc-900 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {user.isLoggedIn ? <Cloud className="h-3.5 w-3.5 text-emerald-400" /> : <LogIn className="h-3.5 w-3.5" />}
            <span>{user.isLoggedIn ? user.username : 'Masuk untuk Sync'}</span>
          </button>
        </div>
      </div>

      {/* Cloud Sync Information Bar */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        user.isLoggedIn
          ? 'bg-zinc-900/60 border-emerald-500/30 text-emerald-300'
          : 'bg-zinc-900/40 border-white/[0.06] text-zinc-400'
      }`}>
        <div className="flex items-center gap-2.5">
          <Cloud className={`h-4 w-4 shrink-0 ${user.isLoggedIn ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <div>
            {user.isLoggedIn ? (
              <span>Tersinkronisasi ke akun cloud: <strong className="text-white">{user.email}</strong>. Data Anda aman lintas gawai.</span>
            ) : (
              <span>Mode Tamu: Data tersimpan secara lokal di peramban ini. Masuk untuk mengaktifkan backup otomatis.</span>
            )}
          </div>
        </div>

        {!user.isLoggedIn && (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="text-xs text-red-400 hover:text-red-300 font-semibold underline self-start sm:self-auto cursor-pointer"
          >
            Aktifkan Sinkronisasi Cloud
          </button>
        )}
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-500/40 bg-zinc-900 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 text-xs overflow-x-auto scrollbar-none">
        {[
          { key: 'all', label: `Semua (${watchlist.length})` },
          { key: 'watching', label: 'Sedang Ditonton' },
          { key: 'plan_to_watch', label: 'Ingin Ditonton' },
          { key: 'completed', label: 'Selesai' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === t.key
                ? 'bg-white text-black font-bold shadow-sm'
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
                onClick={() => handleRemove(anime.id)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-red-600 text-zinc-300 hover:text-white transition-colors cursor-pointer opacity-0 group-hover:opacity-100 z-10"
                title="Hapus dari koleksi"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-zinc-900/40 border border-white/[0.04]">
          <p className="text-sm font-semibold text-zinc-300">
            Belum ada anime di tab ini.
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Buka katalog atau halaman detail anime dan klik tombol &quot;Tambah ke Koleksi&quot;.
          </p>
          <Link
            href="/anime"
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
          >
            Jelajahi Katalog Anime
          </Link>
        </div>
      )}

      {/* Auth Modal Trigger */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onProfileUpdated={(updated) => {
          setUser(updated);
          loadData();
        }}
      />
    </div>
  );
}
