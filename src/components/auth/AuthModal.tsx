'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { getLocalWatchlist, getLocalProgress } from '@/lib/services/watchlist';
import { UserProfile } from '@/types';
import { User, LogIn, LogOut, CloudCheck, X, Check, Cloud } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: UserProfile) => void;
}

export function AuthModal({ isOpen, onClose, onProfileUpdated }: AuthModalProps) {
  const [profile, setProfile] = useState<UserProfile>(() => db.getUserProfile());
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) return;

    const newProfile = db.loginUser(username, email);
    setProfile(newProfile);

    // Otomatis sinkronkan riwayat lokal ke cloud akun
    const watchlist = getLocalWatchlist();
    const progress = getLocalProgress();
    const syncRes = db.syncUserData(watchlist, progress);
    
    setSyncStatus(syncRes.message);
    if (onProfileUpdated) onProfileUpdated(newProfile);
    setTimeout(() => {
      setSyncStatus(null);
      onClose();
    }, 1500);
  };

  const handleLogout = () => {
    const guestProfile = db.logoutUser();
    setProfile(guestProfile);
    if (onProfileUpdated) onProfileUpdated(guestProfile);
    onClose();
  };

  const handleManualSync = () => {
    const watchlist = getLocalWatchlist();
    const progress = getLocalProgress();
    const syncRes = db.syncUserData(watchlist, progress);
    setSyncStatus(syncRes.message);
    setTimeout(() => setSyncStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/[0.1] shadow-2xl p-6 flex flex-col gap-5 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {profile.isLoggedIn ? (
          /* Profile Logged In View */
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="h-12 w-12 rounded-full border border-red-500/40 object-cover"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">
                  {profile.username}
                </span>
                <span className="text-xs text-zinc-400 truncate">
                  {profile.email}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-950 p-3.5 border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <Cloud className="h-4 w-4 shrink-0" />
                <span className="font-semibold">Sinkronisasi Cloud Aktif</span>
              </div>
              <button
                onClick={handleManualSync}
                className="text-[11px] text-zinc-300 hover:text-white underline cursor-pointer"
              >
                Sinkron Sekarang
              </button>
            </div>

            {syncStatus && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>{syncStatus}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer mt-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        ) : (
          /* Login / Register Form */
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <LogIn className="h-4 w-4 text-red-500" />
                <span>Masuk ke Akun ANIME HOME</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Sinkronkan koleksi anime dan riwayat tontonan Anda ke cloud agar tidak hilang saat berganti perangkat.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                  Nama Pengguna (Username)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: Rian_Otaku99"
                  className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contoh: rian@email.com"
                  className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            {syncStatus && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>{syncStatus}</span>
              </div>
            )}

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-red-600/20"
            >
              <LogIn className="h-4 w-4" />
              <span>Masuk & Sinkronkan Data</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
