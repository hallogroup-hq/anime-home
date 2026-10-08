'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';

export default function AdOpsPage() {
  const [campaigns, setCampaigns] = useState(db.getAllCampaigns());
  const [statusMessage, setStatusMessage] = useState('');

  const handleToggle = (campaignId: string) => {
    db.toggleCampaignStatus(campaignId);
    setCampaigns(db.getAllCampaigns());
    setStatusMessage('Status iklan diperbarui.');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handlePauseAll = () => {
    campaigns.forEach(c => {
      if (c.status === 'active') {
        db.toggleCampaignStatus(c.id);
      }
    });
    setCampaigns(db.getAllCampaigns());
    setStatusMessage('Semua iklan dijeda.');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            Iklan & Sponsor
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pengelolaan banner sponsor internal situs.
          </p>
        </div>

        <button
          onClick={handlePauseAll}
          className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs text-red-400 font-semibold"
        >
          Jeda Semua Iklan
        </button>
      </div>

      {statusMessage && (
        <div className="rounded-lg bg-zinc-900 border border-emerald-500/40 p-3 text-xs text-emerald-400">
          {statusMessage}
        </div>
      )}

      <div className="flex flex-col divide-y divide-white/[0.06] rounded-xl bg-zinc-900 border border-white/[0.08]">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-3">
              <img src={camp.imageUrl} alt={camp.name} className="h-10 w-20 rounded object-cover shrink-0" />
              <div>
                <h3 className="font-bold text-white">{camp.name}</h3>
                <span className="text-[11px] text-zinc-500">{camp.sponsorName} • {camp.slotKey}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-zinc-400">
                <span>{camp.impressions.toLocaleString()} views</span>
                <span>{camp.clicks.toLocaleString()} clicks</span>
              </div>

              <button
                onClick={() => handleToggle(camp.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  camp.status === 'active'
                    ? 'bg-zinc-800 text-amber-300 hover:bg-zinc-700'
                    : 'bg-zinc-800 text-emerald-400 hover:bg-zinc-700'
                }`}
              >
                {camp.status === 'active' ? 'Jeda' : 'Aktifkan'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
