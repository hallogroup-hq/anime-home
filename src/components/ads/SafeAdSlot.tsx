'use client';

import { db } from '@/lib/services/store';
import { ExternalLink, Info } from 'lucide-react';

interface SafeAdSlotProps {
  slotKey: 'home_leaderboard' | 'anime_detail_inline' | 'watch_below_controls' | 'search_inline';
  className?: string;
}

export function SafeAdSlot({ slotKey, className = '' }: SafeAdSlotProps) {
  const campaign = db.getActiveCampaignForSlot(slotKey);

  // If no active campaign, collapse gracefully without empty giant white spaces
  if (!campaign) {
    return null;
  }

  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-border-800 bg-surface-900/60 p-3 my-4 transition-all ${className}`}>
      {/* Sponsor Disclosure Header */}
      <div className="flex items-center justify-between pb-2 text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3 text-slate-500" />
          Iklan Sponsor Resmi
        </span>
        <span className="text-slate-500">{campaign.sponsorName}</span>
      </div>

      {/* Ad Creative Banner */}
      <a
        href={campaign.destinationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-xl bg-ink-950 border border-border-700/60"
      >
        <div className="relative aspect-[728/90] sm:aspect-[21/5] w-full min-h-[70px] overflow-hidden">
          <img
            src={campaign.imageUrl}
            alt={campaign.name}
            className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 via-transparent to-transparent flex items-center px-4">
            <div className="max-w-[70%]">
              <p className="text-xs sm:text-sm font-extrabold text-white drop-shadow">
                {campaign.name}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand mt-0.5">
                Kunjungi Toko Mitra <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}
