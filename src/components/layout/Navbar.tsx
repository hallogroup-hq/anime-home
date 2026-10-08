'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bookmark } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/anime?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/anime');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#0c0d12]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
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
              className={`transition-colors cursor-pointer ${
                pathname === '/' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/anime"
              className={`transition-colors cursor-pointer ${
                pathname.startsWith('/anime') ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Katalog
            </Link>
            <Link
              href="/schedule"
              className={`transition-colors cursor-pointer ${
                pathname === '/schedule' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Jadwal Rilis
            </Link>
            <Link
              href="/discover"
              className={`transition-colors cursor-pointer ${
                pathname.startsWith('/discover') ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Merchandise
            </Link>
          </nav>
        </div>

        {/* Right Actions: Real Interactive Search Form */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari anime..."
              className="w-40 sm:w-60 rounded-lg bg-zinc-900 border border-white/[0.08] py-1.5 pl-8 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all"
            />
          </form>

          <Link
            href="/me"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Koleksi</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
