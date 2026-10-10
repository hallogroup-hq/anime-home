'use client';

import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { loginAction } from '@/lib/actions/authActions';

export function AdminAuthGate({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginAction({ email, password });
      if (res.success) {
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          window.location.reload();
        }
      } else {
        setError(res.error || 'Autentikasi gagal');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-white/[0.08] rounded-xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20 mx-auto mb-4">
          <Shield className="w-6 h-6" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-xl font-black tracking-tight text-white mb-1">
            ANIME HOME ADMIN GATE
          </h1>
          <p className="text-xs text-zinc-400">
            Akses operasional terbatas. Memerlukan autentikasi identitas staf dan server-side RBAC.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Email Staf / Akun Terverifikasi
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:outline-none"
              placeholder="admin@animehome.id"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:outline-none"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/20"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{loading ? 'Memverifikasi Identitas...' : 'Masuk ke Admin Console'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sistem Keamanan Aktif: RBAC & Audit Trail</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            Percobaan login ilegal atau brute-force diblokir otomatis oleh server.
          </p>
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda Publik</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
