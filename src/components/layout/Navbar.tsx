'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, Compass, Bookmark, Search, ShieldCheck } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-800 bg-ink-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-black text-white shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform">
              AH
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-brand transition-colors">
                ANIME<span className="text-brand">HOME</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium -mt-1 tracking-wider uppercase">
                Indonesia Watch & Discovery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 pl-4">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/' ? 'text-white bg-surface-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/anime"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                pathname.startsWith('/anime') ? 'text-white bg-surface-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              Katalog Anime
            </Link>
            <Link
              href="/schedule"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/schedule' ? 'text-white bg-surface-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              Jadwal Rilis (WIB)
            </Link>
            <Link
              href="/discover"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                pathname.startsWith('/discover') ? 'text-white bg-surface-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              Merchandise
            </Link>
          </nav>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3">
          <Link
            href="/anime?search=open"
            className="flex items-center gap-2 rounded-xl bg-surface-900 border border-border-700 px-3.5 py-2 text-xs text-slate-300 hover:border-brand/50 hover:text-white transition-all"
            aria-label="Cari anime"
          >
            <Search className="h-4 w-4 text-brand" />
            <span className="hidden sm:inline">Cari judul, karakter, genre...</span>
          </Link>

          <Link
            href="/me"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border-700 bg-surface-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-surface-700 hover:text-white transition-colors"
          >
            <Bookmark className="h-3.5 w-3.5 text-status-subIndo" />
            <span>Library</span>
          </Link>

          <Link
            href="/admin"
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors border ${
              isAdmin
                ? 'bg-brand text-white border-brand'
                : 'bg-surface-900 border-border-700 text-slate-400 hover:text-white hover:border-slate-500'
            }`}
            title="Admin Console"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Admin Ops</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
