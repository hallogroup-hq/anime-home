'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { AdCampaign } from '@/types';
import { Edit3, Check, Plus, Image, ExternalLink, Database } from 'lucide-react';
import { syncAllToDatabaseAction } from '@/lib/actions';

export default function AdOpsPage() {
  const [campaigns, setCampaigns] = useState(() => db.getAllCampaigns());
  const [statusMessage, setStatusMessage] = useState('');
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTargetUrl, setEditTargetUrl] = useState('');
  const [editName, setEditName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleToggle = (campaignId: string) => {
    db.toggleCampaignStatus(campaignId);
    setCampaigns(db.getAllCampaigns());
    setStatusMessage('Status iklan diperbarui.');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleOpenEdit = (camp: AdCampaign) => {
    setEditingCampaign(camp);
    setEditImageUrl(camp.imageUrl);
    setEditTargetUrl(camp.destinationUrl);
    setEditName(camp.name);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    db.updateCampaign(editingCampaign.id, {
      imageUrl: editImageUrl,
      destinationUrl: editTargetUrl,
      name: editName,
    });

    setCampaigns(db.getAllCampaigns());
    setEditingCampaign(null);
    setStatusMessage(`Banner "${editName}" berhasil diperbarui!`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAllToDatabaseAction();
      setStatusMessage(res.message || 'Sinkronisasi database berhasil!');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal sinkronisasi');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-white/[0.08] p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white">
            Pengelolaan Banner Iklan & Promo
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Ganti gambar banner beranda atau video, sesuaikan link tujuan, dan aktifkan/jeda promosi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
          >
            <Database className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Database'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-xl bg-emerald-950/60 border border-emerald-500/40 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Modal Edit Campaign */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form onSubmit={handleSaveEdit} className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-amber-400" />
                <span>Ganti Gambar & Link Banner</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 font-semibold">Nama Kampanye:</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2.5 text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 font-semibold">URL Gambar Banner (Path lokal atau Link HTTP):</label>
                <input
                  type="text"
                  required
                  placeholder="/banners/anime-home-promo-banner.png atau https://..."
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2.5 text-white font-mono text-[11px]"
                />
              </div>

              {/* Preview Gambar */}
              {editImageUrl && (
                <div className="rounded-lg overflow-hidden bg-black border border-white/[0.08] p-2 flex flex-col items-center">
                  <span className="text-[10px] text-zinc-500 mb-1 self-start">Pratinjau Banner:</span>
                  <img
                    src={editImageUrl}
                    alt="Preview"
                    className="max-h-24 w-auto rounded object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 font-semibold">Tautan Tujuan (Saat Banner Diklik):</label>
                <input
                  type="text"
                  required
                  placeholder="/"
                  value={editTargetUrl}
                  onChange={(e) => setEditTargetUrl(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2.5 text-white font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Simpan Banner
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Campaigns */}
      <div className="flex flex-col divide-y divide-white/[0.06] rounded-xl bg-zinc-900 border border-white/[0.08]">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <img 
                src={camp.imageUrl} 
                alt={camp.name} 
                className="h-14 w-28 rounded-lg object-cover shrink-0 bg-black border border-white/[0.06]" 
              />
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-white text-sm truncate">{camp.name}</h3>
                <span className="text-[11px] text-zinc-400 mt-0.5">
                  Slot: <span className="font-mono text-zinc-300">{camp.slotKey}</span> • Sponsor: {camp.sponsorName}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono truncate mt-0.5" title={camp.imageUrl}>
                  {camp.imageUrl}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => handleOpenEdit(camp)}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs text-amber-300 font-semibold transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Ganti Gambar / Link</span>
              </button>

              <button
                onClick={() => handleToggle(camp.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
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
