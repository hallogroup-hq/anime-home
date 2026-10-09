'use client';

import { useState, useMemo } from 'react';
import { db } from '@/lib/services/store';
import { MediaType, AiringStatus, Anime, Episode } from '@/types';
import { Plus, Layers, Check, ExternalLink, Edit3, Trash2, Film, Database, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { 
  createAnimeAction, 
  updateAnimeAction, 
  deleteAnimeAction,
  batchCreateEpisodesAction,
  createEpisodeAction,
  updateEpisodeAction,
  deleteEpisodeAction,
  syncAllToDatabaseAction 
} from '@/lib/actions';

export default function AdminContentPage() {
  const [allAnime, setAllAnime] = useState(() => db.getAnimeList());
  const [activeTab, setActiveTab] = useState<'anime_list' | 'create_anime' | 'episodes_manager' | 'batch_episodes'>('anime_list');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Form State: Tambah Anime
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('TV');
  const [year, setYear] = useState(2024);
  const [seasonPeriod, setSeasonPeriod] = useState<'Winter' | 'Spring' | 'Summer' | 'Fall'>('Spring');
  const [maturityRating, setMaturityRating] = useState('PG-13');
  const [airingStatus, setAiringStatus] = useState<AiringStatus>('airing');
  const [genresInput, setGenresInput] = useState('Action, Fantasy');
  const [synopsis, setSynopsis] = useState('');
  const [posterUrl, setPosterUrl] = useState('https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-U1v5w63g7Lsm.png');
  const [bannerUrl, setBannerUrl] = useState('https://s4.anilist.co/file/anilistcdn/media/anime/banner/171018-b2k20bH64XbV.jpg');

  // Edit Anime Modal State
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAiringStatus, setEditAiringStatus] = useState<AiringStatus>('airing');
  const [editYear, setEditYear] = useState(2024);
  const [editPosterUrl, setEditPosterUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editSynopsis, setEditSynopsis] = useState('');

  // Episode Manager State
  const [selectedAnimeId, setSelectedAnimeId] = useState(allAnime[0]?.id || '');
  const activeAnimeForEpisodes = useMemo(() => allAnime.find(a => a.id === selectedAnimeId), [allAnime, selectedAnimeId]);
  const currentAnimeEpisodes = useMemo(() => db.getEpisodesByAnimeId(selectedAnimeId), [selectedAnimeId, allAnime]);

  // Edit Episode Modal State
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [editEpTitle, setEditEpTitle] = useState('');
  const [editEpNumber, setEditEpNumber] = useState('');

  // Single Add Episode State
  const [showAddSingleEp, setShowAddSingleEp] = useState(false);
  const [singleEpNumber, setSingleEpNumber] = useState('');
  const [singleEpTitle, setSingleEpTitle] = useState('');

  // Batch Buat Episode State
  const [batchCount, setBatchCount] = useState(12);
  const [startOrdinal, setStartOrdinal] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(24);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setSlug(generatedSlug);
  };

  const handleCreateAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) return;
    setLoading(true);

    try {
      const genres = genresInput.split(',').map(g => g.trim()).filter(Boolean);
      const res = await createAnimeAction({
        canonicalTitle: title,
        slug,
        mediaType,
        year: Number(year),
        seasonPeriod,
        maturityRating,
        airingStatus,
        publishState: 'published',
        genres,
        synopsis: synopsis || `Sinopsis untuk ${title}.`,
        posterUrl,
        bannerUrl,
        firstAirDate: new Date().toISOString().slice(0, 10),
      }, [
        { id: `alt-${Date.now()}-1`, animeId: '', locale: 'en-US', title, titleType: 'canonical', normalizedTitle: title.toLowerCase() },
      ]);

      if (res.success && res.anime) {
        db.addAnime(res.anime);
        setAllAnime(db.getAnimeList());
        showNotice('success', `Berhasil menambahkan judul baru: "${res.anime.canonicalTitle}"!`);
        setTitle('');
        setSlug('');
        setSynopsis('');
        setActiveTab('anime_list');
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal menyimpan anime');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditAnime = (a: Anime) => {
    setEditingAnime(a);
    setEditTitle(a.canonicalTitle);
    setEditAiringStatus(a.airingStatus);
    setEditYear(a.year);
    setEditPosterUrl(a.posterUrl);
    setEditBannerUrl(a.bannerUrl || '');
    setEditSynopsis(a.synopsis);
  };

  const handleSaveEditAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnime) return;

    try {
      await updateAnimeAction(editingAnime.id, {
        canonicalTitle: editTitle,
        airingStatus: editAiringStatus,
        year: Number(editYear),
        posterUrl: editPosterUrl,
        bannerUrl: editBannerUrl,
        synopsis: editSynopsis,
      });

      db.updateAnime(editingAnime.id, {
        canonicalTitle: editTitle,
        airingStatus: editAiringStatus,
        year: Number(editYear),
        posterUrl: editPosterUrl,
        bannerUrl: editBannerUrl,
        synopsis: editSynopsis,
      });

      setAllAnime(db.getAnimeList());
      setEditingAnime(null);
      showNotice('success', `Metadata "${editTitle}" berhasil diperbarui!`);
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal memperbarui anime');
    }
  };

  const handleDeleteAnime = async (animeId: string, titleName: string) => {
    if (!confirm(`Yakin ingin menghapus anime "${titleName}" dan seluruh episodenya?`)) return;

    try {
      await deleteAnimeAction(animeId);
      db.deleteAnime(animeId);
      setAllAnime(db.getAnimeList());
      showNotice('success', `Anime "${titleName}" berhasil dihapus.`);
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal menghapus anime');
    }
  };

  const handleAddSingleEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimeId || !singleEpNumber) return;

    try {
      const ordinal = Number(singleEpNumber) || (currentAnimeEpisodes.length + 1);
      const disp = singleEpNumber.padStart(2, '0');
      const epData = {
        animeId: selectedAnimeId,
        ordinal,
        displayNumber: disp,
        episodeType: 'standard' as const,
        title: singleEpTitle || `Episode ${disp}`,
        durationMinutes: 24,
        publishState: 'published' as const,
        airingState: 'aired' as const,
        subtitleState: 'available' as const,
        watchabilityState: 'eligible_verified' as const,
        airedAt: new Date().toISOString(),
      };

      const res = await createEpisodeAction(epData);
      if (res.success && res.episode) {
        db.addEpisode(res.episode);
      } else {
        db.addEpisode(epData);
      }

      setAllAnime(db.getAnimeList());
      setShowAddSingleEp(false);
      setSingleEpNumber('');
      setSingleEpTitle('');
      showNotice('success', `Berhasil menambahkan Episode ${disp}!`);
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal menambahkan episode');
    }
  };

  const handleOpenEditEpisode = (ep: Episode) => {
    setEditingEpisode(ep);
    setEditEpTitle(ep.title);
    setEditEpNumber(ep.displayNumber);
  };

  const handleSaveEditEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEpisode) return;

    try {
      await updateEpisodeAction(editingEpisode.id, {
        title: editEpTitle,
        displayNumber: editEpNumber,
        watchabilityState: 'eligible_verified',
      });

      db.updateEpisode(editingEpisode.id, {
        title: editEpTitle,
        displayNumber: editEpNumber,
        watchabilityState: 'eligible_verified',
      });

      setEditingEpisode(null);
      setAllAnime(db.getAnimeList());
      showNotice('success', `Episode ${editEpNumber} berhasil diperbarui!`);
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal memperbarui episode');
    }
  };

  const handleDeleteEpisode = async (epId: string, dispNum: string) => {
    if (!confirm(`Hapus Episode ${dispNum}?`)) return;

    try {
      await deleteEpisodeAction(epId);
      db.deleteEpisode(epId);
      setAllAnime(db.getAnimeList());
      showNotice('success', `Episode ${dispNum} berhasil dihapus.`);
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal menghapus episode');
    }
  };

  const handleBatchEpisodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimeId || batchCount <= 0) return;
    setLoading(true);

    try {
      const res = await batchCreateEpisodesAction(selectedAnimeId, Number(batchCount), Number(startOrdinal));
      if (res.success && res.episodes) {
        db.batchCreateEpisodes(selectedAnimeId, Number(batchCount), Number(startOrdinal), Number(durationMinutes));
        setAllAnime(db.getAnimeList());
        showNotice('success', `Berhasil membuat ${res.count} episode shell untuk "${activeAnimeForEpisodes?.canonicalTitle}"!`);
        setActiveTab('episodes_manager');
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal membuat batch episode');
    } finally {
      setLoading(false);
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

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Header & Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-white/[0.08] p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Katalog & Manajer Episode</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola judul anime, perbarui status tayang, tambahkan episode baru, atau sinkronkan data ke PostgreSQL.
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2 text-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('anime_list')}
          className={`rounded-lg px-4 py-2 font-bold transition-colors cursor-pointer ${
            activeTab === 'anime_list'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Daftar Katalog ({allAnime.length})
        </button>
        <button
          onClick={() => setActiveTab('episodes_manager')}
          className={`rounded-lg px-4 py-2 font-bold transition-colors cursor-pointer ${
            activeTab === 'episodes_manager'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Kelola Episode Anime
        </button>
        <button
          onClick={() => setActiveTab('create_anime')}
          className={`rounded-lg px-4 py-2 font-bold transition-colors cursor-pointer ${
            activeTab === 'create_anime'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          + Tambah Anime Baru
        </button>
        <button
          onClick={() => setActiveTab('batch_episodes')}
          className={`rounded-lg px-4 py-2 font-bold transition-colors cursor-pointer ${
            activeTab === 'batch_episodes'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Batch Episode Generator
        </button>
      </div>

      {/* TAB 1: DAFTAR KATALOG ANIME */}
      {activeTab === 'anime_list' && (
        <section className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allAnime.map((a) => {
              const epList = db.getEpisodesByAnimeId(a.id);
              const isOngoing = a.airingStatus === 'airing';

              return (
                <div key={a.id} className="flex flex-col rounded-xl bg-zinc-900 border border-white/[0.08] p-4 gap-3">
                  <div className="flex items-start gap-3">
                    <img 
                      src={a.posterUrl} 
                      alt={a.canonicalTitle} 
                      className="h-16 w-12 rounded-lg object-cover shrink-0 bg-zinc-950" 
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white truncate" title={a.canonicalTitle}>
                        {a.canonicalTitle}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isOngoing ? 'bg-emerald-950 text-emerald-400' : 'bg-blue-950 text-blue-400'
                        }`}>
                          {isOngoing ? 'Ongoing' : 'Completed'}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {a.year} • {epList.length} Episode
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1">
                        {a.synopsis}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
                    <button
                      onClick={() => {
                        setSelectedAnimeId(a.id);
                        setActiveTab('episodes_manager');
                      }}
                      className="flex items-center gap-1 text-zinc-300 hover:text-white font-medium"
                    >
                      <Film className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Lihat Episode</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditAnime(a)}
                        className="flex items-center gap-1 text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-zinc-800"
                        title="Edit metadata anime"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>

                      <Link
                        href={`/anime/${a.slug}`}
                        target="_blank"
                        className="p-1 text-zinc-400 hover:text-white"
                        title="Buka halaman publik"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        onClick={() => handleDeleteAnime(a.id, a.canonicalTitle)}
                        className="p-1 text-zinc-500 hover:text-red-400"
                        title="Hapus anime"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: KELOLA EPISODE ANIME */}
      {activeTab === 'episodes_manager' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-white/[0.08] p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-zinc-400">Pilih Anime:</label>
              <select
                value={selectedAnimeId}
                onChange={(e) => setSelectedAnimeId(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-xs text-white font-bold"
              >
                {allAnime.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.canonicalTitle} ({a.airingStatus})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddSingleEp(!showAddSingleEp)}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Tambah 1 Episode</span>
              </button>

              <Link
                href="/admin/matrix"
                className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white"
              >
                <span>Buka Matriks Video</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Form Tambah 1 Episode */}
          {showAddSingleEp && (
            <form onSubmit={handleAddSingleEpisode} className="rounded-xl border border-red-500/30 bg-zinc-900 p-4 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Tambah Episode Baru untuk {activeAnimeForEpisodes?.canonicalTitle}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-zinc-400">Nomor Episode (misal: 03, 1180):</label>
                  <input
                    type="text"
                    required
                    placeholder="03"
                    value={singleEpNumber}
                    onChange={(e) => setSingleEpNumber(e.target.value)}
                    className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-zinc-400">Judul Episode:</label>
                  <input
                    type="text"
                    placeholder="Pertemuan Tak Terduga"
                    value={singleEpTitle}
                    onChange={(e) => setSingleEpTitle(e.target.value)}
                    className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSingleEp(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                >
                  Simpan Episode
                </button>
              </div>
            </form>
          )}

          {/* List Episode */}
          <div className="flex flex-col divide-y divide-white/[0.06] rounded-xl bg-zinc-900 border border-white/[0.08]">
            {currentAnimeEpisodes.length > 0 ? (
              currentAnimeEpisodes.map((ep) => {
                const streams = db.getAllStreamVariants(ep.id);
                return (
                  <div key={ep.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-10 items-center justify-center rounded-lg bg-zinc-950 border border-white/[0.08] font-mono font-bold text-white">
                        {ep.displayNumber}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{ep.title}</span>
                        <span className="text-[11px] text-zinc-500">
                          {streams.length} server streaming • {ep.watchabilityState}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/watch/${ep.id}`}
                        target="_blank"
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1"
                        title="Tonton"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Watch</span>
                      </Link>

                      <button
                        onClick={() => handleOpenEditEpisode(ep)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteEpisode(ep.id, ep.displayNumber)}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400"
                        title="Hapus episode"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-zinc-500">
                Belum ada episode untuk anime ini. Gunakan tombol &quot;+ Tambah 1 Episode&quot; atau &quot;Batch Generator&quot;.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDIT ANIME */}
      {editingAnime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form onSubmit={handleSaveEditAnime} className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-amber-400" />
                <span>Edit Metadata: {editingAnime.canonicalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingAnime(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-zinc-400 font-semibold">Judul Kanonikal:</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 font-semibold">Status Tayang:</label>
                <select
                  value={editAiringStatus}
                  onChange={(e) => setEditAiringStatus(e.target.value as any)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
                >
                  <option value="airing">Sedang Tayang (Ongoing)</option>
                  <option value="completed">Tamat (Completed)</option>
                  <option value="scheduled">Terjadwal (Scheduled)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 font-semibold">Tahun Rilis:</label>
                <input
                  type="number"
                  value={editYear}
                  onChange={(e) => setEditYear(Number(e.target.value))}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-zinc-400 font-semibold">URL Poster:</label>
                <input
                  type="text"
                  value={editPosterUrl}
                  onChange={(e) => setEditPosterUrl(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-zinc-400 font-semibold">URL Banner:</label>
                <input
                  type="text"
                  value={editBannerUrl}
                  onChange={(e) => setEditBannerUrl(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-zinc-400 font-semibold">Sinopsis:</label>
                <textarea
                  rows={3}
                  value={editSynopsis}
                  onChange={(e) => setEditSynopsis(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingAnime(null)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
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

      {/* MODAL EDIT EPISODE */}
      {editingEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form onSubmit={handleSaveEditEpisode} className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700 p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-amber-400" />
                <span>Edit Episode</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingEpisode(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-zinc-400">Nomor Episode:</label>
                <input
                  type="text"
                  required
                  value={editEpNumber}
                  onChange={(e) => setEditEpNumber(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white font-mono font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-zinc-400">Judul Episode:</label>
                <input
                  type="text"
                  required
                  value={editEpTitle}
                  onChange={(e) => setEditEpTitle(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingEpisode(null)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: FORM TAMBAH ANIME BARU */}
      {activeTab === 'create_anime' && (
        <form onSubmit={handleCreateAnime} className="rounded-xl border border-white/[0.08] bg-zinc-900 p-5 flex flex-col gap-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Formulir Metadata Judul Anime
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">Judul Kanonikal:</label>
              <input
                type="text"
                required
                placeholder="Contoh: DanDaDan"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">URL Slug:</label>
              <input
                type="text"
                required
                placeholder="dandadan"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">Tipe Media:</label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as any)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              >
                <option value="TV">TV Series</option>
                <option value="Movie">Movie</option>
                <option value="OVA">OVA</option>
                <option value="ONA">ONA</option>
                <option value="Special">Special</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">Tahun Rilis:</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">Musim Rilis:</label>
              <select
                value={seasonPeriod}
                onChange={(e) => setSeasonPeriod(e.target.value as any)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              >
                <option value="Winter">Winter</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">Status Tayang:</label>
              <select
                value={airingStatus}
                onChange={(e) => setAiringStatus(e.target.value as any)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              >
                <option value="airing">Sedang Tayang (Airing)</option>
                <option value="completed">Tamat (Completed)</option>
                <option value="scheduled">Terjadwal (Scheduled)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-zinc-400 font-semibold">Genre (Pisahkan dengan koma):</label>
              <input
                type="text"
                placeholder="Action, Supernatural, Comedy"
                value={genresInput}
                onChange={(e) => setGenresInput(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">Rating Usia:</label>
              <input
                type="text"
                value={maturityRating}
                onChange={(e) => setMaturityRating(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-3">
              <label className="text-zinc-400 font-semibold">Sinopsis:</label>
              <textarea
                rows={3}
                placeholder="Tuliskan deskripsi atau sinopsis resmi..."
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{loading ? 'Menyimpan...' : 'Publikasikan Anime'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: BATCH EPISODE GENERATOR */}
      {activeTab === 'batch_episodes' && (
        <form onSubmit={handleBatchEpisodes} className="rounded-xl border border-white/[0.08] bg-zinc-900 p-5 flex flex-col gap-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Batch Creator Episode Shell (1-Klik)
          </h2>
          <p className="text-xs text-zinc-400">
            Secara otomatis membuat kerangka episode secara berurutan tanpa harus menginput episode satu per satu.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-zinc-400 font-semibold">Pilih Anime:</label>
              <select
                value={selectedAnimeId}
                onChange={(e) => setSelectedAnimeId(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              >
                {allAnime.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.canonicalTitle} ({a.mediaType})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">Jumlah Episode:</label>
              <input
                type="number"
                min={1}
                max={50}
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">Mulai dari Episode Ke-:</label>
              <input
                type="number"
                min={1}
                value={startOrdinal}
                onChange={(e) => setStartOrdinal(Number(e.target.value))}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
            >
              <Layers className="h-4 w-4" />
              <span>{loading ? 'Memproses...' : `Generate ${batchCount} Episode Shells`}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
