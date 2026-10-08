'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, AlertCircle, DollarSign, History, ArrowLeft, Shield } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Ringkasan', href: '/admin' },
    { label: 'Katalog & Episode', href: '/admin/content' },
    { label: 'Matriks Server', href: '/admin/matrix' },
    { label: 'Registry Provider', href: '/admin/providers' },
    { label: 'Visual CMS', href: '/admin/homepage' },
    { label: 'Takedown Hak Cipta', href: '/admin/rights' },
    { label: 'Iklan Sponsor', href: '/admin/ads' },
    { label: 'Log Audit', href: '/admin/audit' },
  ];

  return (
    <div className="min-h-screen bg-[#090A0F] text-zinc-100 flex flex-col pb-16">
      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-zinc-950 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-xs font-black text-white">
              AH
            </span>
            <span className="text-sm font-black text-white tracking-wider">
              ADMIN CONSOLE
            </span>
            <span className="text-xs text-zinc-500 ml-1">v0.1</span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Website</span>
          </Link>
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
                className={`rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 flex-1">
        {children}
      </div>
    </div>
  );
}
