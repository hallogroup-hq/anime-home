'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '@/lib/services/store';
import { getLocalWatchlist, getLocalProgress } from '@/lib/services/watchlist';
import { loginAction, registerAction, logoutAction, getCurrentUserAction, syncWatchlistAction } from '@/lib/actions/authActions';
import { UserProfile } from '@/types';
import { 
  User, 
  LogIn, 
  LogOut, 
  UserPlus, 
  X, 
  Check, 
  Cloud, 
  AlertCircle, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2,
  ShieldCheck
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: UserProfile) => void;
}

export function AuthModal({ isOpen, onClose, onProfileUpdated }: AuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [profile, setProfile] = useState<UserProfile>(() => db.getUserProfile());

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync profile & session whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsLoading(false);
      document.body.style.overflow = 'hidden';

      // Check current session from server cookies
      getCurrentUserAction().then((serverUser) => {
        if (serverUser) {
          const synced = db.loginUser(
            serverUser.username,
            serverUser.email,
            serverUser.id,
            serverUser.role,
            serverUser.avatarUrl
          );
          setProfile(synced);
          if (onProfileUpdated) onProfileUpdated(synced);
        } else {
          setProfile(db.getUserProfile());
        }
      }).catch(() => {
        setProfile(db.getUserProfile());
      });
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, onProfileUpdated]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Real Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Harap isi alamat email Anda.');
      return;
    }
    if (!password) {
      setErrorMessage('Harap isi kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginAction({ email: cleanEmail, password });
      if (!res.success || !res.user) {
        setErrorMessage(res.error || 'Gagal masuk akun. Periksa email dan kata sandi Anda.');
        setIsLoading(false);
        return;
      }

      // Update local client profile
      const newProfile = db.loginUser(
        res.user.username,
        res.user.email,
        res.user.id,
        res.user.role,
        res.user.avatarUrl
      );
      setProfile(newProfile);

      // Sinkronkan watchlist lokal ke database akun asli
      const localWl = getLocalWatchlist();
      if (localWl.length > 0) {
        await syncWatchlistAction(localWl.map(w => ({ animeId: w.animeId, status: w.status })));
      }
      db.syncUserData(localWl, getLocalProgress());

      setSuccessMessage(`Selamat datang kembali, ${res.user.username}!`);
      if (onProfileUpdated) onProfileUpdated(newProfile);

      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi gangguan saat memproses login. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  // Real Registration Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Nama pengguna wajib diisi minimal 3 karakter.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Format alamat email tidak valid.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter demi keamanan akun Anda.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerAction({
        username: cleanUsername,
        email: cleanEmail,
        password,
      });

      if (!res.success || !res.user) {
        setErrorMessage(res.error || 'Gagal mendaftarkan akun. Silakan periksa kembali data Anda.');
        setIsLoading(false);
        return;
      }

      // Update local client profile
      const newProfile = db.loginUser(
        res.user.username,
        res.user.email,
        res.user.id,
        res.user.role,
        res.user.avatarUrl
      );
      setProfile(newProfile);

      // Sinkronkan watchlist lokal ke database akun baru
      const localWl = getLocalWatchlist();
      if (localWl.length > 0) {
        await syncWatchlistAction(localWl.map(w => ({ animeId: w.animeId, status: w.status })));
      }
      db.syncUserData(localWl, getLocalProgress());

      setSuccessMessage(`Akun berhasil dibuat! Selamat datang, ${res.user.username}.`);
      if (onProfileUpdated) onProfileUpdated(newProfile);

      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mendaftarkan akun. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutAction();
      const guestProfile = db.logoutUser();
      setProfile(guestProfile);
      if (onProfileUpdated) onProfileUpdated(guestProfile);
      setSuccessMessage('Berhasil keluar dari akun.');
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 800);
    } catch (e: any) {
      const guestProfile = db.logoutUser();
      setProfile(guestProfile);
      if (onProfileUpdated) onProfileUpdated(guestProfile);
      setIsLoading(false);
      onClose();
    }
  };

  // Manual Sync Button
  const handleManualSync = async () => {
    setIsLoading(true);
    try {
      const localWl = getLocalWatchlist();
      const localProg = getLocalProgress();
      if (localWl.length > 0) {
        await syncWatchlistAction(localWl.map(w => ({ animeId: w.animeId, status: w.status })));
      }
      const syncRes = db.syncUserData(localWl, localProg);
      setSuccessMessage(syncRes.message || 'Data berhasil disinkronkan ke cloud!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e) {
      setSuccessMessage('Data lokal tersimpan.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      style={{ isolation: 'isolate' }}
    >
      <div 
        className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/[0.1] shadow-2xl p-6 flex flex-col gap-5 relative my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Tutup (Esc)"
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <ShieldCheck className="h-3 w-3" />
                    {profile.role === 'owner' ? 'Owner Resmi' : profile.role === 'admin' ? 'Administrator' : 'Akun Terverifikasi'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-950 p-3.5 border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <Cloud className="h-4 w-4 shrink-0" />
                <span className="font-semibold">Sinkronisasi Cloud Aktif</span>
              </div>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isLoading}
                className="text-[11px] text-zinc-300 hover:text-white underline cursor-pointer disabled:opacity-50"
              >
                Sinkron Sekarang
              </button>
            </div>

            {successMessage && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2.5 text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer mt-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              <span>Keluar dari Akun</span>
            </button>
          </div>
        ) : (
          /* Real Authentication Form (Login vs Register Tabs) */
          <div className="flex flex-col gap-4">
            {/* Header Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-950 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Masuk</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Daftar Akun</span>
              </button>
            </div>

            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {mode === 'login' ? (
                  <>
                    <LogIn className="h-4 w-4 text-red-500" />
                    <span>Masuk ke Akun ANIME HOME</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 text-red-500" />
                    <span>Buat Akun ANIME HOME</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {mode === 'login'
                  ? 'Gunakan email dan kata sandi akun Anda untuk sinkronisasi koleksi.'
                  : 'Daftar akun gratis untuk menyimpan riwayat dan daftar tontonan.'}
              </p>
            </div>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-300 flex items-start gap-2 animate-in fade-in">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>Alamat Email</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>Kata Sandi</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3.5 py-2 pr-9 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                      title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-red-600/20 mt-1 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Masuk Sekarang</span>
                    </>
                  )}
                </button>

                <div className="text-center mt-1">
                  <p className="text-[11px] text-zinc-400">
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMessage(null);
                      }}
                      className="text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                    >
                      Daftar Akun Baru
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>Nama Pengguna (Username)</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: Rian_Otaku"
                    autoComplete="username"
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>Alamat Email</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>Kata Sandi (Min. 6 Karakter)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3.5 py-2 pr-9 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                      title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>Konfirmasi Kata Sandi</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-red-600/20 mt-1 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Buat Akun Sekarang</span>
                    </>
                  )}
                </button>

                <div className="text-center mt-1">
                  <p className="text-[11px] text-zinc-400">
                    Sudah punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                      }}
                      className="text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                    >
                      Masuk di sini
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
