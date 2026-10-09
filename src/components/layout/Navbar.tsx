'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bookmark, User } from 'lucide-react';
import { db } from '@/lib/services/store';
import { AuthModal } from '@/components/auth/AuthModal';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(() => db.getUserProfile());

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
            <img
              src="/brand/logo-square.png"
              alt="Anime Home Logo"
              className="h-9 w-9 rounded-lg object-contain shadow-md"
            />
            <img
              src="/brand/logo-dark.png"
              alt="Anime Home"
              className="h-7 w-auto object-contain hidden sm:block"
            />
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

        {/* Right Actions: Real Interactive Search Form with Instant Dropdown */}
        <div className="flex items-center gap-3 relative">
          <div className="relative">
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

            {/* Instant Search Suggestions Dropdown */}
            {searchTerm.trim().length > 1 && (
              <div className="absolute top-full left-0 mt-1 w-64 sm:w-72 rounded-xl bg-zinc-950 border border-white/[0.1] shadow-2xl p-1.5 z-50 flex flex-col gap-1">
                {(() => {
                  const matches = db.getAnimeList({ query: searchTerm.trim() }).slice(0, 4);
                  if (matches.length === 0) {
                    return (
                      <div className="p-3 text-center text-[11px] text-zinc-500">
                        Tidak ada hasil ditemukan
                      </div>
                    );
                  }
                  return matches.map((item) => (
                    <Link
                      key={item.id}
                      href={`/anime/${item.slug}`}
                      onClick={() => setSearchTerm('')}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer group"
                    >
                      <img
                        src={item.posterUrl}
                        alt={item.canonicalTitle}
                        className="h-9 w-7 rounded object-cover shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-zinc-200 group-hover:text-red-500 truncate transition-colors">
                          {item.canonicalTitle}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {item.mediaType} • {item.year}
                        </span>
                      </div>
                    </Link>
                  ));
                })()}
              </div>
            )}
          </div>

          <Link
            href="/me"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Koleksi</span>
          </Link>

          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title={user.isLoggedIn ? `Masuk sebagai ${user.username}` : 'Masuk ke Akun'}
          >
            <User className="h-3.5 w-3.5 text-red-500" />
            <span className="hidden sm:inline">{user.isLoggedIn ? user.username : 'Masuk'}</span>
          </button>
        </div>
      </div>

      {/* Auth & Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onProfileUpdated={setUser}
      />
    </header>
  );
}
