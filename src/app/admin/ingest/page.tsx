'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { MetadataIngestCandidate } from '@/types';
import { Download, AlertTriangle, Check, ExternalLink, RefreshCw, Search, Sparkles, Globe } from 'lucide-react';
import Link from 'next/link';
import { 
  searchAniListAction, 
  fetchOngoingAniListAction, 
  checkDuplicateAction, 
  ingestAniListCandidateAction 
} from '@/lib/actions';

export default function MetadataIngestPage() {
  const [candidates, setCandidates] = useState<MetadataIngestCandidate[]>(() => db.getIngestCandidates());
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [liveResults, setLiveResults] = useState<any[]>([]);

  const handleRefresh = () => {
    setCandidates(db.getIngestCandidates());
  };

  const handleLiveSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setErrorMessage('');
    try {
      const results = await searchAniListAction(searchQuery.trim());
      // Check duplicates for each result
      const checked = await Promise.all(
        results.map(async (m) => {
          const dup = await checkDuplicateAction(m);
          return { ...m, duplicate: dup };
        })
      );
      setLiveResults(checked);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mencari dari AniList API');
    } finally {
      setSearching(false);
    }
  };

  const handleFetchOngoing = async () => {
    setSearching(true);
    setErrorMessage('');
    try {
      const results = await fetchOngoingAniListAction();
      const checked = await Promise.all(
        results.map(async (m) => {
          const dup = await checkDuplicateAction(m);
          return { ...m, duplicate: dup };
        })
      );
      setLiveResults(checked);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat anime dari AniList API');
    } finally {
      setSearching(false);
    }
  };

  const handleImportLive = async (media: any) => {
    try {
      const res = await ingestAniListCandidateAction(media, true);
      if (res.success) {
        setImportedIds(prev => new Set(prev).add(`cand-anilist-${media.id}`));
        setSuccessMessage(`Berhasil mengimpor "${media.title.romaji}" langsung dari AniList ke PostgreSQL!`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengimpor anime');
    }
  };

  const handleImport = (candidateId: string) => {
    const imported = db.importCandidate(candidateId);
    if (imported) {
      setImportedIds(prev => new Set(prev).add(candidateId));
      setSuccessMessage(`Berhasil mengimpor "${imported.canonicalTitle}" ke dalam katalog publik beserta episode shells!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      handleRefresh();
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
              <Globe className="w-3 h-3" />
              Live AniList GraphQL API
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Wizard Sinkronisasi & Ingest Metadata
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cari dan impor metadata anime resmi secara real-time via API AniList dengan deteksi duplikat otomatis dan Tri-State status engine.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900 px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Muat Ulang Antrean</span>
        </button>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-zinc-900 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-500/40 bg-zinc-900 p-3.5 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live AniList Search Section */}
      <section className="rounded-2xl border border-white/[0.08] bg-zinc-900 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Pencarian Langsung AniList API</span>
          </h2>
          <button
            onClick={handleFetchOngoing}
            disabled={searching}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors disabled:opacity-50"
          >
            {searching ? 'Memuat...' : 'Tarik 10 Anime Trending Musim Ini'}
          </button>
        </div>

        <form onSubmit={handleLiveSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik judul anime (contoh: Dandadan, Bleach, Solo Leveling)..."
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {searching ? 'Mencari...' : 'Cari di AniList'}
          </button>
        </form>

        {/* Live Search Results */}
        {liveResults.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Hasil Ditemukan dari AniList ({liveResults.length}):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {liveResults.map((item) => {
                const isDup = item.duplicate?.isDuplicate;
                const imported = importedIds.has(`cand-anilist-${item.id}`);

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-white/[0.06] bg-zinc-950 flex gap-3 items-start justify-between"
                  >
                    <div className="flex gap-3 min-w-0">
                      <img
                        src={item.coverImage?.large}
                        alt={item.title.romaji}
                        className="w-12 h-16 rounded object-cover shrink-0 border border-white/[0.08]"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-zinc-200 truncate">
                          {item.title.romaji}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {item.format} • {item.seasonYear || 'N/A'} • {item.episodes ? `${item.episodes} Ep` : 'Ongoing'}
                        </span>
                        {isDup ? (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            Duplikat: {item.duplicate.matchedTitle}
                          </span>
                        ) : (
                          <span className="mt-1 text-[10px] text-emerald-400 font-semibold">
                            ✓ Siap Impor (Judul Baru)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleImportLive(item)}
                      disabled={isDup || imported}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                        imported
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : (isDup ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700')
                      }`}
                    >
                      {imported ? 'Diimpor' : (isDup ? 'Tersedia' : 'Impor')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Candidate Queue List */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Antrean Kandidat Musiman Lokal ({candidates.length}):
        </h2>

        {candidates.map((cand) => {
          const isDuplicate = !!cand.duplicateMatchId;
          const isAlreadyImported = importedIds.has(cand.id);

          return (
            <div
              key={cand.id}
              className={`rounded-xl border p-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center transition-all ${
                isDuplicate
                  ? 'bg-zinc-950/60 border-amber-500/30'
                  : 'bg-zinc-900 border-white/[0.08]'
              }`}
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <img
                  src={cand.posterUrl}
                  alt={cand.canonicalTitle}
                  className="h-20 w-14 rounded-lg object-cover shrink-0 border border-white/[0.08]"
                />

                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">
                      {cand.canonicalTitle}
                    </span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {cand.sourceApi.toUpperCase()} #{cand.externalId}
                    </span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {cand.mediaType}
                    </span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {cand.seasonPeriod} {cand.year}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                    {cand.synopsis}
                  </p>

                  {isDuplicate && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{cand.duplicateReason}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                {isDuplicate ? (
                  <Link
                    href={`/anime/${cand.duplicateMatchId?.replace('anime-', '')}`}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                  >
                    <span>Lihat Anime yang Sudah Ada</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => handleImport(cand.id)}
                    disabled={isAlreadyImported}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                      isAlreadyImported
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{isAlreadyImported ? 'Sudah Diimpor' : 'Impor ke Katalog'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
