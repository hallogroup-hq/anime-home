'use client';

import { useState, useMemo } from 'react';
import { QualityLabel, StreamVariant } from '@/types';
import { getVideoAdapter } from '@/lib/adapters/video';
import { db } from '@/lib/services/store';
import { markEpisodeWatched } from '@/lib/services/watchlist';
import { 
  Play, AlertTriangle, CheckCircle, RefreshCw, 
  Flag, Check, Layers, ExternalLink, HelpCircle 
} from 'lucide-react';

interface MultiProviderPlayerProps {
  episodeId: string;
  animeId: string;
  animeTitle: string;
  episodeNumber: string;
  episodeTitle: string;
}

export function MultiProviderPlayer({
  episodeId,
  animeId,
  animeTitle,
  episodeNumber,
  episodeTitle,
}: MultiProviderPlayerProps) {
  // Ambil matriks streaming dinamis dari database untuk episode ini
  const matrix = useMemo(() => db.getStreamMatrix(episodeId), [episodeId]);

  // Resolusi terpilih (default: kualitas tertinggi atau Auto)
  const [selectedQuality, setSelectedQuality] = useState<QualityLabel>(
    matrix.qualities[0] || '720p'
  );

  // Provider varian terpilih di dalam resolusi aktif
  const currentQualityVariants = matrix.variantsByQuality[selectedQuality] || [];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    currentQualityVariants[0]?.id || ''
  );

  // State pemutar & error simulation
  const [hasError, setHasError] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>('broken_embed');
  const [reportNotes, setReportNotes] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Ambil varian aktif
  const activeVariant = useMemo(() => {
    return currentQualityVariants.find(v => v.id === selectedVariantId) || currentQualityVariants[0];
  }, [currentQualityVariants, selectedVariantId]);

  // Adapter untuk varian aktif
  const adapter = useMemo(() => {
    if (!activeVariant) return null;
    return getVideoAdapter(activeVariant.providerId.includes('muse') ? 'youtube' : 'custom_embed');
  }, [activeVariant]);

  // Handle pergantian resolusi
  const handleQualityChange = (q: QualityLabel) => {
    setSelectedQuality(q);
    setHasError(false);
    const variantsInQ = matrix.variantsByQuality[q] || [];
    if (variantsInQ.length > 0) {
      setSelectedVariantId(variantsInQ[0].id);
    }
  };

  // Handle pergantian provider pada resolusi yang sama
  const handleProviderChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    setHasError(false);
  };

  // Fallback ke server lain di resolusi yang sama
  const handleTryNextSameQualityServer = () => {
    const currentIndex = currentQualityVariants.findIndex(v => v.id === activeVariant?.id);
    const nextVariant = currentQualityVariants[(currentIndex + 1) % currentQualityVariants.length];
    if (nextVariant) {
      setSelectedVariantId(nextVariant.id);
      setHasError(false);
    }
  };

  // Simpan progres tontonan manual
  const handleMarkWatched = () => {
    markEpisodeWatched(animeId, episodeId, !isWatched, activeVariant?.id);
    setIsWatched(!isWatched);
  };

  // Submit laporan stream rusak
  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVariant) return;
    db.reportBrokenStream({
      variantId: activeVariant.id,
      episodeId,
      reason: reportReason as any,
      notes: reportNotes,
    });
    setReportSuccess(true);
    setTimeout(() => {
      setIsReportOpen(false);
      setReportSuccess(false);
      setReportNotes('');
    }, 2000);
  };

  if (!matrix.qualities.length || !activeVariant) {
    return (
      <div className="w-full aspect-video rounded-3xl bg-surface-900 border border-border-800 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-status-unverified mb-3" />
        <h3 className="text-lg font-bold text-white">Sumber Belum Terverifikasi</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          Belum ada tautan streaming yang lulus verifikasi hak cipta dan kelaikan penayangan untuk episode ini.
        </p>
      </div>
    );
  }

  const embedUrl = adapter ? adapter.buildEmbedUrl(activeVariant.embedUrl) : activeVariant.embedUrl;

  return (
    <div className="flex flex-col w-full gap-4">
      {/* 16:9 Player Viewport */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-ink-950 border border-border-800 shadow-2xl">
        {!hasError ? (
          <iframe
            key={activeVariant.id}
            src={embedUrl}
            title={`${animeTitle} - Episode ${episodeNumber}`}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          /* Error Fallback State — PRD J02 & FR-STREAM */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900/95 p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-status-delayed mb-3" />
            <h4 className="text-base sm:text-lg font-extrabold text-white">
              {activeVariant.providerName} Sedang Mengalami Kendala
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
              Koneksi terputus atau server tidak merespons. Anda dapat mencoba server cadangan lain di resolusi <span className="font-bold text-white">{selectedQuality}</span>.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5 justify-center">
              {currentQualityVariants.length > 1 && (
                <button
                  onClick={handleTryNextSameQualityServer}
                  className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand-hover transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Coba Server Lain di Kualitas {selectedQuality}
                </button>
              )}
              <button
                onClick={() => setHasError(false)}
                className="rounded-xl border border-border-700 bg-surface-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-surface-700 transition-colors"
              >
                Muat Ulang Server Ini
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MULTI-PROVIDER & RESOLUTION SELECTOR CONSOLE */}
      <div className="flex flex-col gap-3 rounded-2xl bg-surface-900 border border-border-800 p-4 shadow-sm">
        {/* Row 1: Dynamic Resolution Selector Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pilihan Resolusi:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {matrix.qualities.map((q) => {
                const isSelected = selectedQuality === q;
                const count = matrix.variantsByQuality[q]?.length || 0;
                return (
                  <button
                    key={q}
                    onClick={() => handleQualityChange(q)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-brand text-white shadow-md shadow-brand/20 scale-105'
                        : 'bg-surface-800 text-slate-300 hover:bg-surface-700 border border-border-700'
                    }`}
                  >
                    <span>{q}</span>
                    <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${isSelected ? 'bg-white/20' : 'bg-surface-900 text-slate-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player status indicators */}
          {selectedQuality === 'Auto' && (
            <span className="text-[11px] text-cyan-400 flex items-center gap-1 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-800/40">
              <HelpCircle className="h-3 w-3" />
              Bitrate & Kualitas Adaptif (Resmi YouTube API)
            </span>
          )}
        </div>

        {/* Row 2: MULTIPLE PROVIDERS UNDER THE ACTIVE RESOLUTION */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              Server Provider ({selectedQuality}):
            </span>
            <span className="text-[11px] text-slate-500">
              Tersedia {currentQualityVariants.length} provider independen
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {currentQualityVariants.map((variant) => {
              const isSelected = variant.id === activeVariant?.id;
              return (
                <button
                  key={variant.id}
                  onClick={() => handleProviderChange(variant.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-brand bg-brand/10 text-white font-bold ring-1 ring-brand'
                      : 'border-border-700 bg-surface-800/80 text-slate-300 hover:border-slate-500 hover:bg-surface-800'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">{variant.providerName}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                      Sub Indo Terverifikasi
                    </span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-brand" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Action Toolbar (Mark Watched, Error Simulation, Report) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkWatched}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition-colors ${
                isWatched
                  ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                  : 'bg-surface-800 border border-border-700 text-slate-300 hover:text-white'
              }`}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {isWatched ? 'Sudah Ditonton' : 'Tandai Selesai Nonton'}
            </button>

            {/* Tombol Uji Kegagalan Server untuk Demonstrasi Fallback QA-016 */}
            <button
              onClick={() => setHasError(!hasError)}
              className="text-[11px] text-slate-400 hover:text-amber-400 underline decoration-dotted ml-1"
              title="Simulasikan server gagal untuk melihat alur fallback sejenis"
            >
              {hasError ? 'Pulihkan Player' : 'Tes Simulasi Gangguan Server'}
            </button>
          </div>

          <button
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors py-1"
          >
            <Flag className="h-3.5 w-3.5" />
            <span>Laporkan Masalah Server</span>
          </button>
        </div>
      </div>

      {/* REPORT MODAL — PRD J08 */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-surface-900 border border-border-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flag className="h-4 w-4 text-rose-500" />
                Laporkan Masalah Pemutar
              </h3>
              <button
                onClick={() => setIsReportOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center">
                <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">Laporan Berhasil Terkirim</p>
                <p className="text-xs text-slate-400 mt-1">Tim operasional akan meninjau server ini di Action Center.</p>
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="mt-4 flex flex-col gap-3">
                <p className="text-xs text-slate-400">
                  Melaporkan: <span className="font-bold text-white">{activeVariant?.providerName} ({selectedQuality})</span>
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Penyebab Masalah:</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="rounded-xl bg-ink-950 border border-border-700 p-2.5 text-xs text-white focus:outline-none focus:border-brand"
                  >
                    <option value="broken_embed">Video Tidak Bisa Diputar / Layar Hitam</option>
                    <option value="wrong_episode">Salah Episode / Tidak Cocok</option>
                    <option value="subtitle_issue">Subtitle Rusak / Tidak Sinkron</option>
                    <option value="geo_restricted">Dibatasi Wilayah (Geo-block)</option>
                    <option value="copyright_issue">Tuntutan / Pelanggaran Hak Cipta</option>
                    <option value="other">Masalah Lainnya</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Catatan Tambahan (Opsional):</label>
                  <textarea
                    rows={3}
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="Contoh: Berhenti di menit 12:40, audio tidak bersuara..."
                    className="rounded-xl bg-ink-950 border border-border-700 p-2.5 text-xs text-white focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-surface-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-hover"
                  >
                    Kirim Laporan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
