import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Top Up & Voucher — Segera Hadir',
  description: 'Top up game dan voucher digital Anime Home sedang disiapkan. Pembelian belum tersedia.',
  robots: { index: false, follow: true },
};

export default function TopupComingSoonPage() {
  return (
    <div className="min-h-[calc(100svh-196px)] bg-[#090A0F] text-zinc-100">
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8 sm:pt-11 lg:px-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2.5 text-xs text-zinc-500">
          <Link href="/" className="transition-colors hover:text-zinc-100">Beranda</Link>
          <span aria-hidden="true" className="text-zinc-700">/</span>
          <span className="text-zinc-200">Top Up</span>
        </nav>

        <main className="pt-20 sm:pt-28 lg:pt-36">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.12] pb-5">
            <span className="text-xs font-semibold tracking-[0.08em] text-zinc-300">Anime Home / Digital</span>
            <span className="text-xs font-medium text-red-400">COMING SOON</span>
          </div>

          <section aria-labelledby="topup-heading" className="grid gap-11 pb-20 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.6fr)] lg:gap-20 lg:pb-28">
            <h1
              id="topup-heading"
              className="max-w-[720px] text-[clamp(3.25rem,6.5vw,5.75rem)] font-bold leading-[1.04] tracking-[-0.072em]"
            >
              Top up game,
              <span className="block text-zinc-500">sebentar lagi.</span>
            </h1>

            <div className="max-w-sm lg:pt-3">
              <p className="text-base leading-7 text-zinc-300">
                Lagi kami siapin biar kamu bisa top up game dan beli voucher langsung di Anime Home.
              </p>
              <p className="mt-5 text-sm leading-6 text-zinc-500">
                Untuk sekarang, pembelian belum dibuka.
              </p>
            </div>
          </section>

          <div className="flex items-center justify-between gap-6 border-t border-white/[0.12] pt-6">
            <Link
              href="/anime"
              className="group inline-flex items-center gap-2.5 text-sm font-medium text-zinc-200 underline decoration-zinc-700 underline-offset-[6px] transition-colors hover:text-white hover:decoration-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400"
            >
              Jelajahi katalog anime
              <ArrowUpRight aria-hidden="true" size={16} className="text-zinc-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-red-400" />
            </Link>
            <span className="hidden text-xs font-medium text-zinc-600 sm:block">ANIME HOME</span>
          </div>
        </main>
      </div>
    </div>
  );
}
