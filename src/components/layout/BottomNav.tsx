'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Calendar, Bookmark } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  // Sembunyikan pada rute admin
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const items = [
    { label: 'Beranda', href: '/', icon: Home, exact: true },
    { label: 'Katalog', href: '/anime', icon: Film, exact: false },
    { label: 'Jadwal', href: '/schedule', icon: Calendar, exact: false },
    { label: 'Koleksi', href: '/me', icon: Bookmark, exact: false },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#0c0d12]/95 backdrop-blur-lg px-2 pb-[env(safe-area-inset-bottom,8px)] pt-1"
      aria-label="Navigasi Mobile"
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
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 px-2 rounded-lg transition-colors ${
                isActive ? 'text-red-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
