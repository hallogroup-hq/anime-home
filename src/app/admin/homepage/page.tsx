'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { HomepageConfig } from '@/types';
import { ArrowUp, ArrowDown, Eye, EyeOff, Save, Check } from 'lucide-react';
import Link from 'next/link';

export default function HomepageCMSPage() {
  const allAnime = db.getAnimeList();
  const [config, setConfig] = useState<HomepageConfig>(db.getHomepageConfig());
  const [saved, setSaved] = useState(false);

  const handleHeroChange = (animeId: string) => {
    setConfig(prev => ({
      ...prev,
      heroAnimeId: animeId,
    }));
    setSaved(false);
  };

  const handleToggleSection = (sectionId: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    }));
    setSaved(false);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...config.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setConfig(prev => ({
      ...prev,
      sections: newSections,
    }));
    setSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateHomepageConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const heroAnime = allAnime.find(a => a.id === config.heroAnimeId);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            Visual CMS Beranda (Homepage Layout)
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Atur urutan modul, visibilitas seksi, dan sorotan hero tanpa deploy ulang kode.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:text-white"
          >
            Lihat Beranda Publik
          </Link>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saved ? 'Tersimpan!' : 'Simpan Tata Letak'}</span>
          </button>
        </div>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-500/40 bg-zinc-900 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>Tata letak beranda berhasil diperbarui dan tersimpan ke store sistem.</span>
        </div>
      )}

      {/* 1. HERO SPOTLIGHT SELECTOR */}
      <section className="rounded-xl border border-white/[0.08] bg-zinc-900 p-5 flex flex-col gap-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">
          1. Sorotan Utama (Hero Spotlight Banner)
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-full sm:w-80">
            <label className="text-xs text-zinc-400 block mb-1">Pilih Judul Anime:</label>
            <select
              value={config.heroAnimeId}
              onChange={(e) => handleHeroChange(e.target.value)}
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-xs text-white focus:outline-none"
            >
              {allAnime.map(a => (
                <option key={a.id} value={a.id}>
                  {a.canonicalTitle} ({a.year})
                </option>
              ))}
            </select>
          </div>

          {heroAnime && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-950 border border-white/[0.06] text-xs">
              <img src={heroAnime.posterUrl} alt={heroAnime.canonicalTitle} className="h-12 w-9 rounded object-cover" />
              <div>
                <p className="font-semibold text-white">{heroAnime.canonicalTitle}</p>
                <p className="text-[10px] text-zinc-400">{heroAnime.mediaType} • {heroAnime.genres.slice(0, 2).join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. SECTION REORDERING & VISIBILITY */}
      <section className="rounded-xl border border-white/[0.08] bg-zinc-900 p-5 flex flex-col gap-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">
          2. Urutan Modul & Visibilitas Seksi
        </h2>
        <p className="text-xs text-zinc-400">
          Gunakan tombol panah untuk memindahkan posisi modul. Klik ikon mata untuk menyembunyikan atau menampilkan seksi di beranda.
        </p>

        <div className="flex flex-col gap-2 mt-2">
          {config.sections.map((section, idx) => (
            <div
              key={section.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                section.enabled
                  ? 'bg-zinc-950/70 border-white/[0.08] text-white'
                  : 'bg-zinc-950/30 border-white/[0.04] text-zinc-500 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 text-[11px] font-bold text-zinc-300">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold">{section.name}</span>
                {!section.enabled && (
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    Nonaktif
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Toggle Visibility */}
                <button
                  type="button"
                  onClick={() => handleToggleSection(section.id)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    section.enabled
                      ? 'border-white/[0.08] bg-zinc-800 text-zinc-300 hover:text-white'
                      : 'border-white/[0.04] bg-zinc-900 text-zinc-600 hover:text-zinc-400'
                  }`}
                  title={section.enabled ? 'Sembunyikan modul' : 'Tampilkan modul'}
                >
                  {section.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>

                {/* Move Up */}
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveSection(idx, 'up')}
                  className="p-1.5 rounded-lg border border-white/[0.08] bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Pindah ke atas"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  disabled={idx === config.sections.length - 1}
                  onClick={() => handleMoveSection(idx, 'down')}
                  className="p-1.5 rounded-lg border border-white/[0.08] bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Pindah ke bawah"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
