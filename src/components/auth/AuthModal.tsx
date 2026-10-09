'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/services/store';
import { getLocalWatchlist, getLocalProgress } from '@/lib/services/watchlist';
import { UserProfile } from '@/types';
import { User, LogIn, LogOut, X, Check, Cloud, Sparkles, AlertCircle } from 'lucide-react';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync profile immediately whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setProfile(db.getUserProfile());
      setSyncStatus(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const performLogin = (uname: string, umail: string) => {
    if (!uname.trim() || !umail.trim()) {
      setErrorMessage('Harap isi nama pengguna dan email.');
      return;
    }

    try {
      const newProfile = db.loginUser(uname.trim(), umail.trim());
      setProfile(newProfile);
      setErrorMessage(null);

      // Sinkronkan riwayat lokal ke cloud akun
      const watchlist = getLocalWatchlist();
      const progress = getLocalProgress();
      const syncRes = db.syncUserData(watchlist, progress);
      
      setSyncStatus(syncRes.message || 'Berhasil masuk dan sinkronisasi cloud aktif!');
      if (onProfileUpdated) onProfileUpdated(newProfile);
      setTimeout(() => {
        setSyncStatus(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk akun. Silakan coba lagi.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(username, email);
  };

  const handleQuickDemoLogin = () => {
    performLogin('Otaku_Member', 'member@animehome.id');
  };

  const handleLogout = () => {
    const guestProfile = db.logoutUser();
    setProfile(guestProfile);
    if (onProfileUpdated) onProfileUpdated(guestProfile);
    setSyncStatus('Berhasil keluar akun.');
    setTimeout(() => {
      setSyncStatus(null);
      onClose();
    }, 800);
  };

  const handleManualSync = () => {
    const watchlist = getLocalWatchlist();
    const progress = getLocalProgress();
    const syncRes = db.syncUserData(watchlist, progress);
    setSyncStatus(syncRes.message || 'Sinkronisasi berhasil!');
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
                className="h-12 w-12 rounded-full border border-red-500/40 object-cover bg-zinc-800"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">
                  {profile.username}
                </span>
                <span className="text-xs text-zinc-400 truncate">
                  {profile.email}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                  Akun Aktif
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
          /* Login Form with Quick 1-Click Option */
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <LogIn className="h-4 w-4 text-red-500" />
                <span>Masuk ke Akun ANIME HOME</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Simpan anime favorit dan lanjutkan tontonan Anda tanpa batas di semua gawai.
              </p>
            </div>

            {/* Quick 1-Click Login Button */}
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/[0.08] py-2.5 px-4 text-xs font-bold text-white transition-all cursor-pointer shadow-sm hover:border-zinc-500"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Masuk Cepat (1-Klik Akun Demo)</span>
            </button>

            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-semibold">
              <div className="h-px bg-white/[0.08] flex-1" />
              <span>atau gunakan data sendiri</span>
              <div className="h-px bg-white/[0.08] flex-1" />
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">
                  Nama Pengguna (Username)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: Rian_Otaku"
                  className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
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
                />
              </div>

              {errorMessage && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {syncStatus && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>{syncStatus}</span>
                </div>
              )}

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-red-600/20 mt-1"
              >
                <LogIn className="h-4 w-4" />
                <span>Masuk Sekarang</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
