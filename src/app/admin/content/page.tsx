'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { MediaType, AiringStatus } from '@/types';
import { Plus, Layers, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminContentPage() {
  const allAnime = db.getAnimeList();
  const [activeTab, setActiveTab] = useState<'anime' | 'batch_episodes'>('anime');
  const [successMessage, setSuccessMessage] = useState('');

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
  const [posterUrl, setPosterUrl] = useState('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80');

  // Form State: Batch Buat Episode
  const [selectedAnimeId, setSelectedAnimeId] = useState(allAnime[0]?.id || '');
  const [batchCount, setBatchCount] = useState(12);
  const [startOrdinal, setStartOrdinal] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(24);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto slugify
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setSlug(generatedSlug);
  };

  const handleCreateAnime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) return;

    const genres = genresInput.split(',').map(g => g.trim()).filter(Boolean);

    const created = db.addAnime({
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
      aliases: [
        { id: `alt-${Date.now()}-1`, animeId: '', locale: 'en-US', title, titleType: 'canonical', normalizedTitle: title.toLowerCase() },
      ],
    });

    setSuccessMessage(`Berhasil menambahkan judul baru: "${created.canonicalTitle}"!`);
    setTitle('');
    setSlug('');
    setSynopsis('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleBatchEpisodes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimeId || batchCount <= 0) return;

    const episodes = db.batchCreateEpisodes(selectedAnimeId, Number(batchCount), Number(startOrdinal), Number(durationMinutes));
    const targetAnime = allAnime.find(a => a.id === selectedAnimeId);
    setSuccessMessage(`Berhasil membuat ${episodes.length} episode shell untuk "${targetAnime?.canonicalTitle}"!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            Manajer Konten (Katalog & Episode Shells)
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tambah judul anime baru dan buat batch episode secara instan tanpa mengedit database secara manual.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-zinc-900 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 text-xs">
        <button
          onClick={() => setActiveTab('anime')}
          className={`rounded-lg px-3.5 py-1.5 font-bold transition-colors cursor-pointer ${
            activeTab === 'anime'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Tambah Anime Baru
        </button>
        <button
          onClick={() => setActiveTab('batch_episodes')}
          className={`rounded-lg px-3.5 py-1.5 font-bold transition-colors cursor-pointer ${
            activeTab === 'batch_episodes'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Batch Episode Generator
        </button>
      </div>

      {/* TAB 1: FORM TAMBAH ANIME BARU */}
      {activeTab === 'anime' && (
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
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Publikasikan Anime</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: BATCH EPISODE GENERATOR */}
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
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
            >
              <Layers className="h-4 w-4" />
              <span>Generate {batchCount} Episode Shells</span>
            </button>
          </div>
        </form>
      )}

      {/* DAFTAR ANIME SAAT INI */}
      <section className="rounded-xl border border-white/[0.08] bg-zinc-900 p-5 flex flex-col gap-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">
          Katalog Aktif ({allAnime.length} Judul)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {allAnime.map((a) => {
            const epCount = db.getEpisodesByAnimeId(a.id).length;
            return (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-white/[0.06]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={a.posterUrl} alt={a.canonicalTitle} className="h-10 w-8 rounded object-cover shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">{a.canonicalTitle}</span>
                    <span className="text-[10px] text-zinc-500">{epCount} Episode • {a.airingStatus}</span>
                  </div>
                </div>

                <Link
                  href={`/anime/${a.slug}`}
                  target="_blank"
                  className="p-1.5 text-zinc-400 hover:text-white"
                  title="Lihat halaman publik"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
