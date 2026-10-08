'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bookmark } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  // Jika di halaman admin, navbar publik tidak ditampilkan
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#0c0d12]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e50914] text-sm font-black text-white tracking-wider">
              AH
            </span>
            <span className="text-base font-black tracking-tight text-white group-hover:text-red-500 transition-colors">
              ANIME<span className="text-red-500">HOME</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors ${
                pathname === '/' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/anime"
              className={`transition-colors ${
                pathname.startsWith('/anime') ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Katalog
            </Link>
            <Link
              href="/schedule"
              className={`transition-colors ${
                pathname === '/schedule' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Jadwal Rilis
            </Link>
            <Link
              href="/discover"
              className={`transition-colors ${
                pathname.startsWith('/discover') ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Merchandise
            </Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/anime"
            className="flex items-center gap-2 rounded-lg bg-zinc-900/80 border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
          >
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Cari anime...</span>
          </Link>

          <Link
            href="/me"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>Koleksi</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
