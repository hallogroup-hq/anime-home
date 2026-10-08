'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { QualityLabel } from '@/types';
import { Plus, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { addStreamVariantAction, emergencyTakedownAction } from '@/lib/actions';

export default function QualityMatrixPage() {
  const allEpisodes = db.getAllEpisodes();
  const allAnime = db.getAnimeList();
  const providers = db.getAllProviders();

  const [selectedEpisodeId, setSelectedEpisodeId] = useState('ep-frieren-8');
  const [activeTabQuality, setActiveTabQuality] = useState<QualityLabel>('720p');
  const [variantsList, setVariantsList] = useState(() => db.getStreamMatrix('ep-frieren-8').variantsByQuality);

  const [newProviderId, setNewProviderId] = useState(providers[0]?.id || 'prov-alpha');
  const [newQuality, setNewQuality] = useState<QualityLabel>('720p');
  const [newSourceRef, setNewSourceRef] = useState('');
  const [newEmbedUrl, setNewEmbedUrl] = useState('');
  const [newPriority, setNewPriority] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const currentEpisode = allEpisodes.find(e => e.id === selectedEpisodeId) || allEpisodes[0];
  const currentAnime = allAnime.find(a => a.id === currentEpisode?.animeId);

  const refreshMatrix = (epId = selectedEpisodeId) => {
    const updated = db.getStreamMatrix(epId);
    setVariantsList(updated.variantsByQuality);
  };

  const handleSelectEpisode = (epId: string) => {
    setSelectedEpisodeId(epId);
    const updated = db.getStreamMatrix(epId);
    setVariantsList(updated.variantsByQuality);
    if (updated.qualities.length > 0 && !updated.qualities.includes(activeTabQuality)) {
      setActiveTabQuality(updated.qualities[0]);
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    const provider = providers.find(p => p.id === newProviderId);
    if (!provider) return;

    try {
      const res = await addStreamVariantAction({
        episodeId: selectedEpisodeId,
        providerId: provider.id,
        providerName: provider.name,
        qualityLabel: newQuality,
        sourceRef: newSourceRef || `ref-${Date.now()}`,
        embedUrl: newEmbedUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        audioLocale: 'ja-JP',
        subtitleLocale: 'id-ID',
        priority: Number(newPriority),
        verificationState: 'verified',
        moderationState: 'approved',
      });

      if (res.success && res.variant) {
        db.addStreamVariant(res.variant);
      }
      refreshMatrix();
      setShowAddForm(false);
      setNewSourceRef('');
      setNewEmbedUrl('');
      setSuccessMessage(`Berhasil menambahkan server pada ${newQuality} di PostgreSQL.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan varian stream');
    }
  };

  const handlePauseVariant = async (variantId: string) => {
    try {
      await emergencyTakedownAction(variantId, 'Dinonaktifkan via Quality Matrix');
      db.emergencyPauseSource(variantId, 'Dinonaktifkan via Quality Matrix');
      refreshMatrix();
    } catch (err: any) {
      alert(err.message || 'Gagal menonaktifkan varian');
    }
  };

  const currentVariants = variantsList[activeTabQuality] || [];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            Matriks Server: {currentAnime?.canonicalTitle} (Ep {currentEpisode?.displayNumber})
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kelola daftar server dan resolusi tanpa perubahan kode atau database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Episode Selector Dropdown */}
          <select
            value={selectedEpisodeId}
            onChange={(e) => handleSelectEpisode(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
          >
            {allEpisodes.map((ep) => {
              const anime = allAnime.find(a => a.id === ep.animeId);
              return (
                <option key={ep.id} value={ep.id}>
                  {anime?.canonicalTitle} - Ep {ep.displayNumber}
                </option>
              );
            })}
          </select>

          <Link
            href={`/watch/${selectedEpisodeId}`}
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:text-white"
          >
            <span>Buka Player</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Server</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-lg bg-zinc-900 border border-emerald-500/40 p-3 text-xs text-emerald-400">
          {successMessage}
        </div>
      )}

      {/* FORM TAMBAH SERVER BARU */}
      {showAddForm && (
        <form onSubmit={handleAddVariant} className="rounded-xl border border-white/[0.1] bg-zinc-900 p-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Tambah Sumber Server Baru
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400">Provider:</label>
              <select
                value={newProviderId}
                onChange={(e) => setNewProviderId(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400">Resolusi:</label>
              <select
                value={newQuality}
                onChange={(e) => setNewQuality(e.target.value as any)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              >
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
                <option value="Auto">Auto</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400">Prioritas Urutan:</label>
              <input
                type="number"
                value={newPriority}
                onChange={(e) => setNewPriority(Number(e.target.value))}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400">ID / Ref Sumber:</label>
              <input
                type="text"
                placeholder="frieren-08-server-extra"
                value={newSourceRef}
                onChange={(e) => setNewSourceRef(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400">Embed URL:</label>
              <input
                type="text"
                placeholder="https://..."
                value={newEmbedUrl}
                onChange={(e) => setNewEmbedUrl(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700"
            >
              Simpan Server
            </button>
          </div>
        </form>
      )}

      {/* TABS RESOLUSI */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-2 text-xs font-semibold">
        {(['1080p', '720p', '480p', '360p', 'Auto'] as QualityLabel[]).map((q) => {
          const count = variantsList[q]?.length || 0;
          const isActive = activeTabQuality === q;
          return (
            <button
              key={q}
              onClick={() => setActiveTabQuality(q)}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {q} ({count})
            </button>
          );
        })}
      </div>

      {/* TABEL SERVER DI RESOLUSI TERPILIH */}
      <div className="flex flex-col divide-y divide-white/[0.06] rounded-xl bg-zinc-900 border border-white/[0.08]">
        {currentVariants.length > 0 ? (
          currentVariants.map((variant) => (
            <div
              key={variant.id}
              className="p-4 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-white">{variant.providerName}</span>
                <span className="text-zinc-500 font-mono text-[11px] truncate max-w-xs">{variant.sourceRef}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePauseVariant(variant.id)}
                  className="rounded-lg bg-zinc-800 hover:bg-red-950/80 hover:text-red-400 border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-300 transition-colors"
                >
                  Takedown / Nonaktifkan
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-zinc-500">
            Tidak ada server aktif untuk resolusi {activeTabQuality}.
          </div>
        )}
      </div>
    </div>
  );
}
