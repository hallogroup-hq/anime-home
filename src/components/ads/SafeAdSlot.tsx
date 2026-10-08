'use client';

import { db } from '@/lib/services/store';

interface SafeAdSlotProps {
  slotKey: 'home_leaderboard' | 'anime_detail_inline' | 'watch_below_controls' | 'search_inline';
  className?: string;
}

export function SafeAdSlot({ slotKey, className = '' }: SafeAdSlotProps) {
  const campaign = db.getActiveCampaignForSlot(slotKey);

  if (!campaign) {
    return null;
  }

  return (
    <div className={`w-full overflow-hidden my-4 ${className}`}>
      <div className="relative overflow-hidden rounded-xl bg-zinc-950 border border-white/[0.06] group">
        <a
          href={campaign.destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block aspect-[728/90] sm:aspect-[24/5] min-h-[64px] w-full overflow-hidden"
        >
          <img
            src={campaign.imageUrl}
            alt={campaign.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />
          <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
            Ad
          </span>
        </a>
      </div>
    </div>
  );
}
