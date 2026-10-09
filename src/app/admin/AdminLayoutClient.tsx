'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Shield, LogOut, Database, Check } from 'lucide-react';
import { logoutAction } from '@/lib/actions/authActions';
import { syncAllToDatabaseAction } from '@/lib/actions';

interface AdminLayoutClientProps {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    avatarUrl?: string;
  };
  children: React.ReactNode;
}

export function AdminLayoutClient({ user, children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleGlobalSync = async () => {
    setSyncing(true);
    try {
      const res = await syncAllToDatabaseAction();
      setSyncNotice(res.message || 'Sinkronisasi berhasil!');
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal sinkronisasi');
    } finally {
      setSyncing(false);
    }
  };

  const navItems = [
    { label: 'Ringkasan', href: '/admin' },
    { label: 'Katalog & Episode', href: '/admin/content' },
    { label: 'Matriks Server', href: '/admin/matrix' },
    { label: 'Registry Provider', href: '/admin/providers' },
    { label: 'Visual CMS', href: '/admin/homepage' },
    { label: 'Ingest Metadata', href: '/admin/ingest' },
    { label: 'Health Monitoring', href: '/admin/monitoring' },
    { label: 'Takedown Hak Cipta', href: '/admin/rights' },
    { label: 'Iklan Sponsor', href: '/admin/ads' },
    { label: 'Log Audit', href: '/admin/audit' },
  ];

  const handleLogout = async () => {
    await logoutAction();
    window.location.reload();
  };

  const roleColors: Record<string, string> = {
    owner: 'bg-red-500/10 text-red-400 border-red-500/20',
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    editor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    operator: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    moderator: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-zinc-100 flex flex-col pb-16">
      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-zinc-950 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-xs font-black text-white">
              AH
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-wider">
                ADMIN CONSOLE
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${roleColors[user.role] || 'bg-zinc-800 text-zinc-400'}`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 border-r border-white/[0.08] pr-3">
              <span className="text-zinc-200 font-semibold">{user.username}</span>
              <span className="text-[11px] text-zinc-500">({user.email})</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:text-red-400 hover:border-red-500/30 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>

            <button
              onClick={handleGlobalSync}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
              title="Sinkronkan seluruh perubahan ke PostgreSQL & Penyimpanan"
            >
              <Database className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{syncing ? 'Menyinkronkan...' : 'Sinkronkan DB'}</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Ke Website</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="border-b border-white/[0.06] bg-zinc-900/40 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-2 text-xs font-semibold">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 flex-1">
        {syncNotice && (
          <div className="mb-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 p-3.5 text-xs text-emerald-300 flex items-center gap-2 shadow-lg">
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{syncNotice}</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
