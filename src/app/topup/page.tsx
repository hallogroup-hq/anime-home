import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Gamepad2, LockKeyhole } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Top Up & Voucher — Segera Hadir',
  description: 'Top up game dan voucher digital Anime Home sedang disiapkan. Pembelian belum tersedia.',
  robots: { index: false, follow: true },
};

export default function TopupComingSoonPage() {
  return (
    <div className="min-h-[calc(100vh-200px)] bg-[#090A0F] text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-16">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/" className="transition-colors hover:text-white">Beranda</Link>
          <span aria-hidden="true" className="text-zinc-700">/</span>
          <span className="text-zinc-300">Top Up</span>
        </nav>

        <section className="relative mt-9 overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#11131B] px-6 py-12 sm:mt-11 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-[#DC2626]" />
          <div className="relative max-w-[720px]">
            <div className="mb-9 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300">
              <Gamepad2 size={15} aria-hidden="true" />
              Anime Home Digital
            </div>

            <h1 className="max-w-[720px] text-4xl font-extrabold leading-[1.06] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              Top up game.
              <span className="mt-1 block text-red-500">Segera hadir.</span>
            </h1>

            <p className="mt-7 max-w-[540px] text-sm leading-7 text-zinc-400 sm:text-base">
              Kami sedang menyiapkan top up game, voucher, dan produk digital di Anime Home.
              Katalog dan sistem pembayarannya masih dalam tahap persiapan.
            </p>

            <div className="mt-9 flex max-w-fit items-center gap-2 rounded-lg border border-white/[0.09] bg-[#0D0F16] px-4 py-3 text-sm text-zinc-300">
              <LockKeyhole size={16} className="shrink-0 text-zinc-400" aria-hidden="true" />
              <span>Belum menerima pembelian</span>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400">
                <ArrowLeft size={17} aria-hidden="true" /> Kembali ke beranda
              </Link>
              <Link href="/anime" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.13] px-5 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400">
                Jelajahi anime <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-zinc-500">
          <span>Game top up & voucher digital</span>
          <span>ANIME HOME</span>
        </div>
      </div>
    </div>
  );
}
