import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, ChevronRight, Gamepad2, Package, Search, ShieldCheck, Zap } from 'lucide-react';
import { GAMES, listGamesWithCounts, catalogPreviewEnabled, catalogCapturedAt } from '@/lib/topup/data';
import { TopupDirectory } from '@/components/topup/TopupDirectory';

export const metadata: Metadata = {
  title: 'Top Up Game & Voucher Digital',
  description: 'Pilih game favorit dan nominal top up. Checkout aman di Anime Home.',
  alternates: { canonical: '/topup' },
};

export const dynamic = 'force-dynamic';

export default async function TopupPage() {
  const previewOnly = catalogPreviewEnabled();
  const counts = await listGamesWithCounts().catch(() => []);
  const active = new Map(counts.map(x => [x.slug, x]));
  const games = GAMES.map(game => ({
    slug: game.slug, name: game.name, short: game.short, accent: game.accent,
    count: active.get(game.slug)?.count || 0, fromPrice: active.get(game.slug)?.starting || null,
  }));

  return (
    <div className="min-h-screen bg-[#090A0F] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-7 sm:px-6 sm:pt-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/" className="hover:text-white">Beranda</Link>
          <ChevronRight size={13} />
          <span className="text-zinc-200">Top Up & Voucher</span>
        </nav>

        <section className="mt-8 grid overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#11131B] md:grid-cols-[1.5fr_0.75fr]">
          <div className="px-6 py-9 sm:px-10 sm:py-12">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/[0.08] px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] text-red-300">
              <Zap size={13} /> ANIME HOME DIGITAL STORE
            </div>
            <h1 className="max-w-[650px] text-4xl font-extrabold leading-[1.05] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              Game on.<br /><span className="text-red-500">Top up di sini.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-400 sm:text-base">
              {previewOnly ? 'Jelajahi nominal dan harga referensi game favoritmu dari katalog VIPayment. Pembelian belum dibuka.' : 'Diamond, UC, dan kebutuhan digital untuk game favoritmu. Pilih nominal, isi ID pemain, lalu bayar melalui sistem pembayaran khusus toko digital.'}
            </p>
            {previewOnly && <p className="mt-3 text-xs font-semibold text-amber-300">Mode katalog · Harga referensi, bukan penawaran pembelian{catalogCapturedAt() ? " · Data diambil pada " + new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeZone:"Asia/Jakarta"}).format(new Date(catalogCapturedAt()!)) : ""}</p>}
            <a href="#pilih-game" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-500">
              Pilih game <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="hidden border-l border-white/[0.06] bg-[#151822] md:flex flex-col justify-between p-8">
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold tracking-[0.24em] text-zinc-500">DIGITAL / 01</span>
              <Gamepad2 size={36} className="text-red-500" strokeWidth={1.4} />
            </div>
            <div className="space-y-4">
              <div className="h-px w-full bg-white/[0.08]" />
              <div className="flex items-center gap-3 text-sm text-zinc-200"><ShieldCheck size={18} className="text-red-400" /> Pembayaran terverifikasi</div>
              <div className="flex items-center gap-3 text-sm text-zinc-200"><Package size={18} className="text-red-400" /> Pemrosesan melalui supplier</div>
              <p className="text-xs leading-5 text-zinc-500">Ketersediaan dan harga mengikuti katalog supplier yang aktif.</p>
            </div>
          </div>
        </section>

        <section id="pilih-game" className="scroll-mt-24 pt-12 sm:pt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-red-400">Pilih kategori</p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Top up game</h2>
            </div>
            <p className="text-sm text-zinc-500">Pilih judul untuk melihat nominal yang tersedia</p>
          </div>
          <TopupDirectory games={games} />
        </section>

        <section className="mt-16 flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-[#11131B] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl font-bold">Voucher & produk digital lainnya</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              Kategori tambahan akan muncul setelah layanan dan cara pengirimannya diverifikasi.
              Produk yang belum tersedia tidak dapat dipesan.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm text-zinc-400">
            <Search size={16} /> Katalog terus diperbarui
          </div>
        </section>
      </div>
    </div>
  );
}
