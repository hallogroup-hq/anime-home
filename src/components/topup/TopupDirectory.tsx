'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';

type Game = { slug: string; name: string; short: string; accent: string; count: number; fromPrice: number | null; total?: number; source?: string };
const money = (n: number) => 'Rp' + n.toLocaleString('id-ID');

export function TopupDirectory({ games }: { games: Game[] }) {
  const [query, setQuery] = useState('');
  const [showAvailable, setShowAvailable] = useState(false);
  const filtered = useMemo(() => games.filter(game =>
    game.name.toLowerCase().includes(query.trim().toLowerCase()) &&
    (!showAvailable || game.count > 0)
  ), [games, query, showAvailable]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex w-full items-center gap-3 rounded-xl border border-white/[0.1] bg-[#11131B] px-4 focus-within:border-red-500/50 sm:max-w-sm">
          <Search size={17} className="shrink-0 text-zinc-500" />
          <span className="sr-only">Cari game</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari judul game..."
            className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-zinc-600" />
        </label>
        <button onClick={() => setShowAvailable(x => !x)}
          className={`rounded-xl border px-4 py-3 text-xs font-semibold transition-colors ${showAvailable ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-white/[0.08] bg-[#11131B] text-zinc-400 hover:text-white'}`}>
          {showAvailable ? 'Menampilkan yang tersedia' : 'Hanya yang tersedia'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#11131B] p-12 text-center text-zinc-400">
          Tidak ada game yang cocok. Coba pencarian lain.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
          {filtered.map(game => (
            <Link key={game.slug} href={`/topup/${game.slug}`}
              className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11131B] transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-[#161925]">
              <div className="relative flex aspect-[1.2] items-center justify-center overflow-hidden border-b border-white/[0.06]"
                style={{ backgroundColor: game.accent + '1C' }}>
                <div className="absolute inset-x-5 bottom-0 h-px opacity-40" style={{ backgroundColor: game.accent }} />
                <span className="text-4xl font-black tracking-[-0.08em] sm:text-5xl" style={{ color: game.accent }}>
                  {game.short}
                </span>
                <ArrowUpRight size={16} className="absolute right-4 top-4 text-white/35 transition-colors group-hover:text-white" />
              </div>
              <div className="p-3.5 sm:p-4">
                <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-white">{game.name}</h3>
                <p className="mt-1.5 truncate text-[11px] text-zinc-500">
                  {game.count > 0 && game.fromPrice ? `Mulai ${money(game.fromPrice)}` : 'Belum tersedia'}
                </p>
                {typeof game.total === 'number' && (
                  <p className="mt-1 text-[11px] text-zinc-600">{game.count.toLocaleString('id-ID')} tersedia · {game.total.toLocaleString('id-ID')} produk</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
