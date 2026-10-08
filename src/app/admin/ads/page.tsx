'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { DollarSign, ShieldAlert, CheckCircle2, Pause, Play, BarChart3 } from 'lucide-react';

export default function AdOpsPage() {
  const [campaigns, setCampaigns] = useState(db.getAllCampaigns());
  const [statusMessage, setStatusMessage] = useState('');

  const handleToggle = (campaignId: string) => {
    db.toggleCampaignStatus(campaignId);
    setCampaigns(db.getAllCampaigns());
    setStatusMessage('Status kampanye sponsor berhasil diperbarui.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handlePauseAll = () => {
    campaigns.forEach(c => {
      if (c.status === 'active') {
        db.toggleCampaignStatus(c.id);
      }
    });
    setCampaigns(db.getAllCampaigns());
    setStatusMessage('Seluruh iklan sponsor berhasil di-pause (Emergency SOP-09).');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-brand" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              AdOps & Sponsorship Management (ADM-ADS)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pengelolaan iklan sponsor non-intrusif sesuai standar Coalition for Better Ads.
          </p>
        </div>

        <button
          onClick={handlePauseAll}
          className="rounded-xl border border-rose-500/50 bg-rose-950/40 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Emergency Pause Semua Iklan (SOP-09)</span>
        </button>
      </div>

      {statusMessage && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs font-bold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {statusMessage}
        </div>
      )}

      {/* Campaigns Table */}
      <div className="flex flex-col gap-3">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-900 border border-border-800"
          >
            <div className="flex items-center gap-4">
              <img src={camp.imageUrl} alt={camp.name} className="h-14 w-28 rounded-xl object-cover shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {camp.name}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    camp.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-surface-800 text-slate-400'
                  }`}>
                    {camp.status.toUpperCase()}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Sponsor: {camp.sponsorName} • Slot: <code className="text-brand">{camp.slotKey}</code></p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block">Impressions</span>
                  <span className="font-extrabold">{camp.impressions.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Clicks</span>
                  <span className="font-extrabold">{camp.clicks.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">CTR</span>
                  <span className="font-extrabold">{((camp.clicks / camp.impressions) * 100).toFixed(2)}%</span>
                </div>
              </div>

              <button
                onClick={() => handleToggle(camp.id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  camp.status === 'active'
                    ? 'bg-amber-950 border border-amber-600/40 text-amber-300 hover:bg-amber-900'
                    : 'bg-emerald-950 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-900'
                }`}
              >
                {camp.status === 'active' ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Jeda Kampanye</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Aktifkan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
