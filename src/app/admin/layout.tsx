'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, LayoutDashboard, Layers, FileText, 
  DollarSign, Activity, AlertOctagon, History, ArrowLeft 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Action Center', href: '/admin', icon: LayoutDashboard },
    { label: 'Quality Matrix (Streaming)', href: '/admin/matrix', icon: Layers },
    { label: 'Hak Cipta & Takedown', href: '/admin/rights', icon: AlertOctagon },
    { label: 'AdOps & Sponsor', href: '/admin/ads', icon: DollarSign },
    { label: 'Audit Trail', href: '/admin/audit', icon: History },
  ];

  return (
    <div className="min-h-screen bg-ink-950 text-slate-100 flex flex-col pb-16">
      {/* Top Admin Operational Bar */}
      <div className="border-b border-border-800 bg-surface-900/95 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-border-700 bg-surface-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Ke Situs Publik</span>
            </Link>
            <div className="h-4 w-[1px] bg-border-700" />
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black tracking-wider uppercase text-white">
                ANIME HOME Control Plane
              </span>
              <span className="rounded bg-brand/20 border border-brand/40 px-1.5 py-0.2 text-[10px] font-bold text-brand">
                Zero-Code Ops
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Peran: <strong className="text-white">Owner / Full Capabilities</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">MFA Aktif</span>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="border-b border-border-800 bg-ink-900/60 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand text-white shadow-md shadow-brand/20'
                    : 'text-slate-400 hover:text-white hover:bg-surface-800/80'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6">
        {children}
      </div>
    </div>
  );
}
