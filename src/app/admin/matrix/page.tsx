'use client';

import { useState, useMemo } from 'react';
import { db } from '@/lib/services/store';
import { QualityLabel, StreamVariant } from '@/types';
import { Plus, Check, ExternalLink, Play, Trash2, Edit3, RefreshCw, Copy, Eye, EyeOff, Save, Database } from 'lucide-react';
import Link from 'next/link';
import { 
  addStreamVariantAction, 
  updateVariantAction, 
  deleteVariantAction, 
  emergencyTakedownAction, 
  restoreVariantAction,
  syncAllToDatabaseAction 
} from '@/lib/actions';

export default function QualityMatrixPage() {
  const allAnime = db.getAnimeList();
  const providers = db.getAllProviders();

  // Selected State
  const [selectedAnimeId, setSelectedAnimeId] = useState(allAnime[0]?.id || '');
  const episodesForAnime = useMemo(() => db.getEpisodesByAnimeId(selectedAnimeId), [selectedAnimeId]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(() => episodesForAnime[0]?.id || '');

  // Ensure selectedEpisodeId matches current anime
  const activeEpisode = useMemo(() => {
    return episodesForAnime.find(e => e.id === selectedEpisodeId) || episodesForAnime[0];
  }, [episodesForAnime, selectedEpisodeId]);

  const activeAnime = useMemo(() => {
    return allAnime.find(a => a.id === selectedAnimeId);
  }, [allAnime, selectedAnimeId]);

  const currentEpId = activeEpisode?.id || '';

  const [activeTabQuality, setActiveTabQuality] = useState<QualityLabel>('720p');
  const [matrixVersion, setMatrixVersion] = useState(0);

  // Form State: Add New Variant
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProviderId, setNewProviderId] = useState(providers[0]?.id || 'prov-blogger');
  const [newQuality, setNewQuality] = useState<QualityLabel>('720p');
  const [newSourceRef, setNewSourceRef] = useState('');
  const [newEmbedUrl, setNewEmbedUrl] = useState('');
  const [newPriority, setNewPriority] = useState(10);

  // Edit Modal State
  const [editingVariant, setEditingVariant] = useState<StreamVariant | null>(null);
  const [editEmbedUrl, setEditEmbedUrl] = useState('');
  const [editQuality, setEditQuality] = useState<QualityLabel>('720p');
  const [editProviderName, setEditProviderName] = useState('');

  // Preview Player State
  const [previewVariantId, setPreviewVariantId] = useState<string | null>(null);

  // Messages & Loading
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAnimeChange = (animeId: string) => {
    setSelectedAnimeId(animeId);
    const eps = db.getEpisodesByAnimeId(animeId);
    if (eps.length > 0) {
      setSelectedEpisodeId(eps[0].id);
    }
    setPreviewVariantId(null);
  };

  const matrix = useMemo(() => {
    if (!currentEpId) return { qualities: [], variantsByQuality: {} as any };
    return db.getStreamMatrix(currentEpId);
  }, [currentEpId, matrixVersion]);

  // All variants for current episode (including non-approved)
  const allCurrentVariants = useMemo(() => {
    if (!currentEpId) return [];
    return db.getAllStreamVariants(currentEpId);
  }, [currentEpId, matrixVersion]);

  const currentVariantsOnTab = useMemo(() => {
    return allCurrentVariants.filter(v => v.qualityLabel === activeTabQuality);
  }, [allCurrentVariants, activeTabQuality]);

  // Handlers
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmbedUrl.trim() || !currentEpId) return;

    const provider = providers.find(p => p.id === newProviderId) || providers[0];

    try {
      const res = await addStreamVariantAction({
        episodeId: currentEpId,
        providerId: provider.id,
        providerName: provider.name,
        qualityLabel: newQuality,
        sourceRef: newSourceRef || `${activeAnime?.slug || 'ep'}-${activeEpisode?.displayNumber}-${newQuality}`,
        embedUrl: newEmbedUrl.trim(),
        audioLocale: 'ja-JP',
        subtitleLocale: 'id-ID',
        priority: Number(newPriority),
        verificationState: 'verified',
        moderationState: 'approved',
      });

      if (res.success && res.variant) {
        db.addStreamVariant(res.variant);
      } else {
        db.addStreamVariant({
          episodeId: currentEpId,
          providerId: provider.id,
          providerName: provider.name,
          qualityLabel: newQuality,
          sourceRef: newSourceRef || `${activeAnime?.slug || 'ep'}-${activeEpisode?.displayNumber}-${newQuality}`,
          embedUrl: newEmbedUrl.trim(),
          audioLocale: 'ja-JP',
          subtitleLocale: 'id-ID',
          priority: Number(newPriority),
          verificationState: 'verified',
          moderationState: 'approved',
        });
      }

      setMatrixVersion(v => v + 1);
      setShowAddForm(false);
      setNewEmbedUrl('');
      setNewSourceRef('');
      showNotice('success', `Berhasil menambahkan server ${newQuality} (${provider.name})!`);
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal menambahkan server');
    }
  };

  const handleOpenEdit = (v: StreamVariant) => {
    setEditingVariant(v);
    setEditEmbedUrl(v.embedUrl);
    setEditQuality(v.qualityLabel);
    setEditProviderName(v.providerName);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    try {
      await updateVariantAction(editingVariant.id, {
        embedUrl: editEmbedUrl.trim(),
        qualityLabel: editQuality,
        providerName: editProviderName,
        moderationState: 'approved',
        verificationState: 'verified',
      });

      db.updateStreamVariant(editingVariant.id, {
        embedUrl: editEmbedUrl.trim(),
        qualityLabel: editQuality,
        providerName: editProviderName,
        moderationState: 'approved',
        verificationState: 'verified',
      });

      setMatrixVersion(v => v + 1);
      setEditingVariant(null);
      showNotice('success', 'Tautan video berhasil diperbarui!');
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal memperbarui tautan');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Yakin ingin menghapus server ini?')) return;

    try {
      await deleteVariantAction(variantId);
      db.deleteStreamVariant(variantId);
      setMatrixVersion(v => v + 1);
      if (previewVariantId === variantId) setPreviewVariantId(null);
      showNotice('success', 'Server video berhasil dihapus.');
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal menghapus server');
    }
  };

  const handleToggleTakedown = async (v: StreamVariant) => {
    try {
      if (v.moderationState === 'approved') {
        await emergencyTakedownAction(v.id, 'Dinonaktifkan via Matrix');
        db.emergencyPauseSource(v.id, 'Dinonaktifkan via Matrix');
        showNotice('success', 'Server dinonaktifkan.');
      } else {
        await restoreVariantAction(v.id);
        db.restoreSource(v.id);
        showNotice('success', 'Server diaktifkan kembali.');
      }
      setMatrixVersion(v => v + 1);
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal mengubah status server');
    }
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAllToDatabaseAction();
      showNotice('success', res.message || 'Sinkronisasi database berhasil!');
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal sinkronisasi');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* 1. HEADER & SINKRONISASI DATABASE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-white/[0.08] p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Matriks & Editor Video Episode</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Ganti link video, tambah server, cek resolusi, dan sinkronkan data langsung ke PostgreSQL dalam 1-klik.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
            title="Sinkronkan seluruh data anime, episode, dan link video ke PostgreSQL"
          >
            <Database className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Database'}</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Server</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className={`rounded-xl border p-3.5 text-xs flex items-center gap-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
            : 'bg-red-950/60 border-red-500/40 text-red-300'
        }`}>
          <Check className="h-4 w-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* 2. SELECTOR: ANIME & EPISODE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pilih Anime */}
        <div className="rounded-xl bg-zinc-900 border border-white/[0.08] p-4 flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-400">1. Pilih Judul Anime:</label>
          <select
            value={selectedAnimeId}
            onChange={(e) => handleAnimeChange(e.target.value)}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 p-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
          >
            {allAnime.map((a) => (
              <option key={a.id} value={a.id}>
                {a.canonicalTitle} ({a.airingStatus})
              </option>
            ))}
          </select>
          {activeAnime && (
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1">
              <span>{activeAnime.mediaType} • {activeAnime.year} • {episodesForAnime.length} Episode</span>
            </div>
          )}
        </div>

        {/* Pilih Episode */}
        <div className="md:col-span-2 rounded-xl bg-zinc-900 border border-white/[0.08] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-400">
              2. Pilih Episode ({episodesForAnime.length} Tersedia):
            </label>
            {activeEpisode && (
              <Link
                href={`/watch/${activeEpisode.id}`}
                target="_blank"
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
              >
                <span>Buka di Player</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {episodesForAnime.map((ep) => {
              const isSelected = ep.id === currentEpId;
              const epVariants = allCurrentVariants.filter(v => v.episodeId === ep.id);
              return (
                <button
                  key={ep.id}
                  onClick={() => {
                    setSelectedEpisodeId(ep.id);
                    setPreviewVariantId(null);
                  }}
                  className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-zinc-950 border border-white/[0.06] text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <span>Ep {ep.displayNumber}</span>
                  <span className="text-[9px] font-normal opacity-80">
                    {epVariants.length} srv
                  </span>
                </button>
              );
            })}
          </div>

          {activeEpisode && (
            <p className="text-xs text-zinc-300 mt-0.5 truncate">
              {activeEpisode.title}
            </p>
          )}
        </div>
      </div>

      {/* 3. FORM TAMBAH SERVER BARU */}
      {showAddForm && (
        <form onSubmit={handleAddVariant} className="rounded-2xl border border-red-500/30 bg-zinc-900 p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="h-4 w-4 text-red-500" />
              <span>Tambah Server Video untuk Episode {activeEpisode?.displayNumber}</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400">Pilih Provider:</label>
              <select
                value={newProviderId}
                onChange={(e) => setNewProviderId(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2.5 text-white"
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
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2.5 text-white"
              >
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
                <option value="Auto">Auto</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400">Prioritas Urutan (Semakin tinggi semakin di depan):</label>
              <input
                type="number"
                value={newPriority}
                onChange={(e) => setNewPriority(Number(e.target.value))}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <label className="text-zinc-400 font-semibold">Tautan Embed Video (Blogger, Mega, YouTube, dll):</label>
            <input
              type="text"
              required
              placeholder="https://www.blogger.com/video.g?token=... atau https://mega.nz/embed/..."
              value={newEmbedUrl}
              onChange={(e) => setNewEmbedUrl(e.target.value)}
              className="rounded-lg bg-zinc-950 border border-zinc-700 p-2.5 text-white font-mono text-[11px]"
            />
            <span className="text-[10px] text-zinc-500">
              Mendukung URL embed Blogger, Mega, Google Stream, YouTube.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg px-4 py-2 text-xs text-zinc-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
            >
              Simpan Server
            </button>
          </div>
        </form>
      )}

      {/* 4. MODAL EDIT SERVER TERTENTU */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form onSubmit={handleSaveEdit} className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-amber-400" />
                <span>Edit Tautan & Data Server</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingVariant(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-zinc-400">Nama Provider:</label>
                <input
                  type="text"
                  value={editProviderName}
                  onChange={(e) => setEditProviderName(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-zinc-400">Resolusi:</label>
                <select
                  value={editQuality}
                  onChange={(e) => setEditQuality(e.target.value as any)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
                >
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                  <option value="360p">360p</option>
                  <option value="Auto">Auto</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label className="text-zinc-400 font-semibold">Embed URL:</label>
              <textarea
                rows={3}
                required
                value={editEmbedUrl}
                onChange={(e) => setEditEmbedUrl(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2.5 text-white font-mono text-[11px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingVariant(null)}
                className="rounded-lg px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. TABS RESOLUSI */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-2 text-xs font-semibold">
        {(['1080p', '720p', '480p', '360p', 'Auto'] as QualityLabel[]).map((q) => {
          const count = allCurrentVariants.filter(v => v.qualityLabel === q).length;
          const isActive = activeTabQuality === q;
          return (
            <button
              key={q}
              onClick={() => {
                setActiveTabQuality(q);
                setPreviewVariantId(null);
              }}
              className={`rounded-lg px-3.5 py-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{q}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                count > 0 ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 6. DAFTAR SERVER PADA RESOLUSI AKTIF */}
      <div className="flex flex-col gap-3">
        {currentVariantsOnTab.length > 0 ? (
          currentVariantsOnTab.map((variant) => {
            const isPreviewing = previewVariantId === variant.id;
            const isApproved = variant.moderationState === 'approved';

            return (
              <div
                key={variant.id}
                className="flex flex-col rounded-xl bg-zinc-900 border border-white/[0.08] overflow-hidden"
              >
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  {/* Left: Info Provider & Link */}
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">
                        {variant.providerName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
                        {variant.qualityLabel}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isApproved ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                      }`}>
                        {isApproved ? 'Aktif (Approved)' : variant.moderationState}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Prio: {variant.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px] bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                      <span className="truncate flex-1" title={variant.embedUrl}>
                        {variant.embedUrl}
                      </span>
                      <button
                        onClick={() => handleCopyLink(variant.embedUrl, variant.id)}
                        className="text-zinc-400 hover:text-white shrink-0"
                        title="Salin Embed URL"
                      >
                        {copiedId === variant.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => setPreviewVariantId(isPreviewing ? null : variant.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        isPreviewing
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      {isPreviewing ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{isPreviewing ? 'Tutup Tes' : 'Tes Putar'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(variant)}
                      className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs text-amber-300 font-semibold transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Link</span>
                    </button>

                    <button
                      onClick={() => handleToggleTakedown(variant)}
                      className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors cursor-pointer"
                    >
                      {isApproved ? 'Takedown' : 'Aktifkan'}
                    </button>

                    <button
                      onClick={() => handleDeleteVariant(variant.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Hapus server ini"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Test Player */}
                {isPreviewing && (
                  <div className="border-t border-white/[0.08] bg-black p-4 flex flex-col items-center">
                    <div className="text-[11px] text-zinc-400 mb-2 flex items-center justify-between w-full max-w-xl">
                      <span>Pratinjau Live Video:</span>
                      <span className="font-mono text-zinc-500">{variant.providerName} • {variant.qualityLabel}</span>
                    </div>
                    <div className="relative aspect-video w-full max-w-xl rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                      <iframe
                        src={variant.embedUrl}
                        title={`Preview ${variant.providerName}`}
                        className="h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-zinc-500 rounded-xl bg-zinc-900 border border-white/[0.08]">
            Belum ada server untuk resolusi {activeTabQuality} pada Episode {activeEpisode?.displayNumber}.
            <div className="mt-3">
              <button
                onClick={() => {
                  setNewQuality(activeTabQuality);
                  setShowAddForm(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Server di {activeTabQuality}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
