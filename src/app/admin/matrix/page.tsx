'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { QualityLabel, StreamVariant } from '@/types';
import { 
  Layers, Plus, Trash2, CheckCircle2, AlertOctagon, 
  ExternalLink, Sparkles, ShieldCheck, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

export default function QualityMatrixPage() {
  const episodeId = 'ep-frieren-8'; // Episode sampel utama PRD
  const matrix = db.getStreamMatrix(episodeId);
  const providers = db.getAllProviders();

  const [activeTabQuality, setActiveTabQuality] = useState<QualityLabel>('720p');
  const [variantsList, setVariantsList] = useState(matrix.variantsByQuality);

  // Form state untuk menambah provider baru ke resolusi tertentu (SOP-03 & QA-033)
  const [newProviderId, setNewProviderId] = useState(providers[0]?.id || 'prov-alpha');
  const [newQuality, setNewQuality] = useState<QualityLabel>('720p');
  const [newSourceRef, setNewSourceRef] = useState('');
  const [newEmbedUrl, setNewEmbedUrl] = useState('');
  const [newPriority, setNewPriority] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const refreshMatrix = () => {
    const updated = db.getStreamMatrix(episodeId);
    setVariantsList(updated.variantsByQuality);
  };

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    const provider = providers.find(p => p.id === newProviderId);
    if (!provider) return;

    db.addStreamVariant({
      episodeId,
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

    refreshMatrix();
    setShowAddForm(false);
    setNewSourceRef('');
    setNewEmbedUrl('');
    setSuccessMessage(`Berhasil menambahkan ${provider.name} ke kualitas ${newQuality}!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handlePauseVariant = (variantId: string) => {
    db.emergencyPauseSource(variantId, 'Dinonaktifkan via Quality Matrix Editor');
    refreshMatrix();
  };

  const currentVariants = variantsList[activeTabQuality] || [];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-brand" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Streaming Quality Matrix Manager (ADM-QUALITY-MATRIX)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Mengatur relasi banyak provider di setiap tingkatan resolusi untuk <strong className="text-white">Sousou no Frieren — Episode 08</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/watch/ep-frieren-8"
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-border-700 bg-surface-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white"
          >
            <span>Verifikasi di Watch Page</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-hover shadow-lg shadow-brand/20"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Server Provider</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs font-bold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* MODAL / FORM TAMBAH SERVER BARU KE RESOLUSI TERTENTU (SOP-03) */}
      {showAddForm && (
        <form onSubmit={handleAddVariant} className="rounded-3xl border border-border-700 bg-surface-900 p-6 flex flex-col gap-4 shadow-2xl">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-brand" />
            Tambah Sumber Server Baru ke Resolusi
          </h3>
          <p className="text-xs text-slate-400 -mt-2">
            Dapat menambahkan server ke-1, ke-2, ke-3, hingga ke-6 pada resolusi mana pun tanpa batasan.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Pilih Provider:</label>
              <select
                value={newProviderId}
                onChange={(e) => setNewProviderId(e.target.value)}
                className="rounded-xl bg-ink-950 border border-border-700 p-2.5 text-xs text-white focus:outline-none focus:border-brand"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Target Resolusi:</label>
              <select
                value={newQuality}
                onChange={(e) => setNewQuality(e.target.value as any)}
                className="rounded-xl bg-ink-950 border border-border-700 p-2.5 text-xs text-white focus:outline-none focus:border-brand"
              >
                <option value="360p">360p</option>
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="Auto">Auto (Adaptive)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Bobot Prioritas (Tinggi = Di Atas):</label>
              <input
                type="number"
                value={newPriority}
                onChange={(e) => setNewPriority(Number(e.target.value))}
                className="rounded-xl bg-ink-950 border border-border-700 p-2.5 text-xs text-white focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Source Identifier / Asset ID:</label>
              <input
                type="text"
                placeholder="frieren-08-custom-server"
                value={newSourceRef}
                onChange={(e) => setNewSourceRef(e.target.value)}
                className="rounded-xl bg-ink-950 border border-border-700 p-2.5 text-xs text-white focus:outline-none focus:border-brand"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Authorized Embed URL:</label>
              <input
                type="text"
                placeholder="https://www.youtube.com/embed/..."
                value={newEmbedUrl}
                onChange={(e) => setNewEmbedUrl(e.target.value)}
                className="rounded-xl bg-ink-950 border border-border-700 p-2.5 text-xs text-white focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-surface-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-white hover:bg-brand-hover shadow-lg shadow-brand/20"
            >
              Simpan & Terbitkan Server
            </button>
          </div>
        </form>
      )}

      {/* RESOLUTION TABS */}
      <div className="flex items-center gap-2 border-b border-border-800 pb-2 overflow-x-auto scrollbar-none">
        {(['Auto', '1080p', '720p', '480p', '360p'] as QualityLabel[]).map((q) => {
          const count = variantsList[q]?.length || 0;
          const isActive = activeTabQuality === q;
          return (
            <button
              key={q}
              onClick={() => setActiveTabQuality(q)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-brand text-white shadow-md shadow-brand/20'
                  : 'bg-surface-900 border border-border-700 text-slate-400 hover:text-white'
              }`}
            >
              <span>{q}</span>
              <span className={`text-[10px] px-2 py-0.2 rounded-full ${isActive ? 'bg-white/20' : 'bg-surface-800 text-slate-400'}`}>
                {count} Provider
              </span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE PROVIDERS UNDER CURRENT RESOLUTION */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">
            Daftar Provider untuk Resolusi {activeTabQuality}:
          </span>
          <span className="text-[11px] text-slate-500">
            Perubahan langsung aktif di sisi publik tanpa perlu redeploy kode
          </span>
        </div>

        {currentVariants.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5">
            {currentVariants.map((variant) => (
              <div
                key={variant.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-900 border border-border-800 hover:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-800 border border-border-700 font-bold text-xs text-white">
                    {variant.qualityLabel}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      {variant.providerName}
                      <span className="rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-[10px] px-2 py-0.2 font-semibold">
                        Prioritas {variant.priority}
                      </span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block truncate max-w-md">
                      Ref: {variant.sourceRef}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePauseVariant(variant.id)}
                    className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900 transition-colors flex items-center gap-1.5"
                  >
                    <AlertOctagon className="h-3.5 w-3.5" />
                    <span>Emergency Takedown</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl border border-border-800 bg-surface-900/40 text-center text-xs text-slate-500">
            Tidak ada provider aktif untuk resolusi {activeTabQuality}. Klik tombol &quot;Tambah Server Provider&quot; di atas untuk mendaftarkan sumber.
          </div>
        )}
      </div>
    </div>
  );
}
