'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Compass, User, Search } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on admin panel
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const items = [
    { label: 'Beranda', href: '/', icon: Home, exact: true },
    { label: 'Anime', href: '/anime', icon: Film, exact: false },
    { label: 'Discover', href: '/discover', icon: Compass, exact: false },
    { label: 'Saya', href: '/me', icon: User, exact: false },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border-800 bg-ink-950/95 backdrop-blur-lg px-2 pb-[env(safe-area-inset-bottom,8px)] pt-1"
      aria-label="Navigasi Utama Mobile"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 px-2 rounded-xl transition-colors ${
                isActive ? 'text-brand font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg transition-transform ${isActive ? 'scale-110 bg-brand/10' : ''}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
