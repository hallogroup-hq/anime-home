'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowLeft } from 'lucide-react';

export default function WatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('WatchPage Client Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
        <RefreshCw className="w-7 h-7" />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">
        Gagal Memuat Pemutar Video
      </h1>
      <p className="text-sm text-zinc-400 max-w-md mb-6">
        Terjadi kendala saat memuat stream player. Silakan coba muat ulang atau pilih episode lainnya dari katalog.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/20 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Muat Ulang Pemutar</span>
        </button>
        <Link
          href="/anime"
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Katalog Anime</span>
        </Link>
      </div>
    </div>
  );
}
