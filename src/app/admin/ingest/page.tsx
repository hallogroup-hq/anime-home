'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { MetadataIngestCandidate } from '@/types';
import { Download, AlertTriangle, Check, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function MetadataIngestPage() {
  const [candidates, setCandidates] = useState<MetadataIngestCandidate[]>(() => db.getIngestCandidates());
  const [successMessage, setSuccessMessage] = useState('');
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const handleRefresh = () => {
    setCandidates(db.getIngestCandidates());
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
          <h1 className="text-xl font-bold text-white">
            Wizard Sinkronisasi & Ingest Metadata
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tinjau kandidat anime musiman dari API eksternal (AniList / MAL) dengan deteksi duplikat otomatis sebelum dipublikasikan.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900 px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Muat Ulang Kandidat</span>
        </button>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-zinc-900 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Candidate List */}
      <div className="flex flex-col gap-4">
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
              {/* Anime Artwork & Info */}
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <img
                  src={cand.posterUrl}
                  alt={cand.canonicalTitle}
                  className="h-20 w-14 rounded-lg object-cover shrink-0 border border-white/[0.08]"
                />

                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      {cand.canonicalTitle}
                    </span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400 uppercase">
                      {cand.sourceApi} • ID: {cand.externalId}
                    </span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                      {cand.year} • {cand.seasonPeriod}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 max-w-2xl">
                    {cand.synopsis}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {cand.genres.map((g) => (
                      <span key={g} className="text-[10px] text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded">
                        {g}
                      </span>
                    ))}
                    {cand.totalEpisodes && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded font-medium">
                        {cand.totalEpisodes} Episode
                      </span>
                    )}
                  </div>

                  {/* DUPLICATE WARNING */}
                  {isDuplicate && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/40 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span><strong>Duplikat Terdeteksi:</strong> {cand.duplicateReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {isDuplicate ? (
                  <button
                    disabled
                    className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-500 cursor-not-allowed"
                    title="Anime sudah ada di katalog"
                  >
                    Tolak (Duplikat)
                  </button>
                ) : isAlreadyImported ? (
                  <span className="rounded-lg bg-emerald-950 text-emerald-400 px-4 py-2 text-xs font-bold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Telah Diimpor
                  </span>
                ) : (
                  <button
                    onClick={() => handleImport(cand.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Setujui & Ingest (1-Klik)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
