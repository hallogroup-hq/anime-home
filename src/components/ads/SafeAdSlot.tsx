'use client';

import { db } from '@/lib/services/store';

import Link from 'next/link';

interface SafeAdSlotProps {
  slotKey: 'home_leaderboard' | 'anime_detail_inline' | 'watch_below_controls' | 'search_inline';
  className?: string;
}

export function SafeAdSlot({ slotKey, className = '' }: SafeAdSlotProps) {
  const campaign = db.getActiveCampaignForSlot(slotKey);

  if (!campaign) {
    return null;
  }

  const isInternal = campaign.destinationUrl.startsWith('/');

  const content = (
    <>
      <img
        src={campaign.imageUrl}
        alt={campaign.name}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
      />
      <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[9px] font-semibold text-zinc-300 border border-white/[0.1]">
        <span>Sponsor Resmi</span>
      </div>
    </>
  );

  return (
    <div className={`w-full overflow-hidden my-4 ${className}`}>
      <div className="relative overflow-hidden rounded-xl bg-zinc-950 border border-white/[0.06] group">
        {isInternal ? (
          <Link
            href={campaign.destinationUrl}
            className="relative block aspect-[728/90] sm:aspect-[24/5] min-h-[64px] w-full overflow-hidden"
          >
            {content}
          </Link>
        ) : (
          <a
            href={campaign.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block aspect-[728/90] sm:aspect-[24/5] min-h-[64px] w-full overflow-hidden"
          >
            {content}
          </a>
        )}
      </div>
    </div>
  );
}
