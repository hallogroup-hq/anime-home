import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { GAMES, gameConfig, publicProductsForGame, catalogPreviewEnabled, catalogCapturedAt, visibleGame } from '@/lib/topup/data';
import { CatalogPreview } from '@/components/topup/CatalogPreview';
import { TopupCheckout } from '@/components/topup/TopupCheckout';
import { fullCatalogPreviewEnabled, fullCategory, fullCategoryProducts } from '@/lib/topup/full-directory';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export function generateStaticParams() { return GAMES.map(game => ({ slug: game.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const game = gameConfig(slug);
  const expanded = fullCatalogPreviewEnabled() ? await fullCategory(slug).catch(() => null) : null;
  return { title: expanded ? expanded.name + ' — Katalog Digital' : game ? 'Top Up ' + game.name : 'Top Up Game', robots: { index: Boolean(game) && !expanded } };
}

export default async function GameTopupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const previewOnly = catalogPreviewEnabled();
  const expanded = fullCatalogPreviewEnabled() ? await fullCategory(slug).catch(() => null) : null;
  const configured = gameConfig(slug);
  if (!expanded && (!configured || !visibleGame(slug))) notFound();
  const game = expanded ? {
    slug: expanded.slug, name: expanded.name, short: expanded.short, accent: expanded.accent,
    targetLabel: 'ID Tujuan', targetHint: 'Cara pengiriman perlu diverifikasi.',
    requiresZone: false, zoneLabel: 'Server / Zone ID'
  } : configured!;
  const products = expanded ? await fullCategoryProducts(slug).catch(() => []) : await publicProductsForGame(slug).catch(() => []);
  const capturedAt = expanded?.capturedAt || (previewOnly ? await catalogCapturedAt().catch(()=>null) : null);
  return (
    <div className="min-h-screen bg-[#090A0F]">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-7 sm:px-6">
        <nav className="mb-7 flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/topup" className="hover:text-white">Top Up</Link>
          <ChevronRight size={13} /><span className="text-zinc-200">{game.name}</span>
        </nav>
        <Link href="/topup" className="mb-7 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white">
          <ArrowLeft size={16} /> Semua game
        </Link>
        <div className="mb-9 flex flex-wrap items-center gap-5">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/[0.08] text-2xl font-black"
            style={{ backgroundColor: game.accent + '20', color: game.accent }}>{game.short}</div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-red-400">{expanded ? 'Katalog VIPayment' : 'Game top up'}</p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{game.name}</h1>
            <p className="mt-2 text-sm text-zinc-400">{previewOnly ? "Lihat daftar nominal dan harga referensi dari VIPayment. Pembelian belum dibuka." : "Pilih nominal dan masukkan data akun dengan benar."}</p>
          </div>
        </div>
        {previewOnly ? <CatalogPreview products={products} capturedAt={capturedAt} expanded={Boolean(expanded)}/> : <TopupCheckout game={{
          slug: game.slug, name: game.name, targetLabel: game.targetLabel,
          targetHint: game.targetHint, requiresZone: game.requiresZone,
          zoneLabel: game.zoneLabel || 'Zone ID',
        }} products={products.map(p => ({
          sku: p.sku, name: p.name, price: p.price, description: p.description,
        }))} />}
      </div>
    </div>
  );
}
