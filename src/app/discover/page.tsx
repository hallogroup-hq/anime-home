'use client';

import { db } from '@/lib/services/store';
import { ExternalLink } from 'lucide-react';

export default function DiscoverPage() {
  const merchItems = db.getAllMerch();

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 max-w-7xl mx-auto pt-4 pb-16">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white">
          Merchandise Anime
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Koleksi merchandise dan figur anime resmi dari toko mitra.
        </p>
      </div>

      {/* Merch Grid: Clean & Direct */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {merchItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col rounded-xl bg-zinc-900 border border-white/[0.06] overflow-hidden group"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-black">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 left-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                {item.animeTitle}
              </span>
            </div>

            <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2">
                  {item.name}
                </h3>
                <p className="text-sm font-bold text-white mt-1">
                  Rp {item.price.toLocaleString('id-ID')}
                </p>
                <span className="text-[11px] text-zinc-500 block mt-0.5">{item.storeName}</span>
              </div>

              <a
                href={item.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                <span>Lihat di Toko</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
