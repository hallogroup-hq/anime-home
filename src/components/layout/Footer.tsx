'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  // Jangan tampilkan footer di panel admin
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="border-t border-white/[0.06] bg-[#0c0d12] text-xs text-zinc-500 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <div className="flex items-center gap-2">
            <img
              src="/brand/logo-square.png"
              alt="Anime Home"
              className="h-7 w-7 rounded-md object-contain"
            />
            <img
              src="/brand/logo-dark.png"
              alt="Anime Home"
              className="h-5 w-auto object-contain"
            />
          </div>
          <p className="text-[11px] text-zinc-500 text-center sm:text-left">
            Platform penemuan dan pelacakan anime untuk penggemar di Indonesia.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
          <Link href="/anime" className="hover:text-white transition-colors">Katalog</Link>
          <Link href="/schedule" className="hover:text-white transition-colors">Jadwal Rilis</Link>
          <Link href="/discover" className="hover:text-white transition-colors">Merchandise</Link>
        </div>
      </div>
    </footer>
  );
}
