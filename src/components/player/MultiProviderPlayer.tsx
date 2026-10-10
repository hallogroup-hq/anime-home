'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { QualityLabel, StreamVariant } from '@/types';
import { getVideoAdapter } from '@/lib/adapters/video';
import { db } from '@/lib/services/store';
import { markEpisodeWatched } from '@/lib/services/watchlist';
import { AlertCircle, RefreshCw, Flag, Check, Maximize2, Minimize2, Moon, Sun, ChevronRight } from 'lucide-react';

interface MultiProviderPlayerProps {
  episodeId: string;
  animeId: string;
  animeTitle: string;
  episodeNumber: string;
  episodeTitle: string;
  nextEpisodeId?: string;
  nextEpisodeNumber?: string;
  streamMatrix?: {
    qualities: QualityLabel[];
    variantsByQuality: Record<QualityLabel, StreamVariant[]>;
  };
}

export function MultiProviderPlayer({
  episodeId,
  animeId,
  animeTitle,
  episodeNumber,
  episodeTitle,
  nextEpisodeId,
  nextEpisodeNumber,
  streamMatrix,
}: MultiProviderPlayerProps) {
  // Ambil matriks streaming terproteksi (prioritaskan server-rendered matrix untuk keamanan & stabilitas maksimal)
  const matrix = useMemo(() => {
    if (streamMatrix && streamMatrix.qualities && streamMatrix.qualities.length > 0) {
      return streamMatrix;
    }
    return db.getSecureStreamMatrix(episodeId);
  }, [episodeId, streamMatrix]);

  // Resolusi terpilih (default: 720p jika ada, atau Auto jika ada, atau resolusi pertama)
  const defaultQuality = useMemo(() => {
    if (matrix.qualities.includes('720p')) return '720p';
    if (matrix.qualities.includes('Auto')) return 'Auto';
    return (matrix.qualities[0] || '720p') as QualityLabel;
  }, [matrix.qualities]);
  
  const [selectedQuality, setSelectedQuality] = useState<QualityLabel>(defaultQuality);

  // Sync quality saat episode berganti
  useEffect(() => {
    setSelectedQuality(defaultQuality);
  }, [defaultQuality]);

  // Varian server pada resolusi yang aktif (prioritaskan stream nyata, tapi simpan opsi server cadangan)
  const currentServers = useMemo(() => {
    const allInQ = matrix.variantsByQuality[selectedQuality] || [];
    return [...allInQ].sort((a, b) => {
      const aIsPlaceholder = a.embedUrl.startsWith('/embed/player');
      const bIsPlaceholder = b.embedUrl.startsWith('/embed/player');
      if (aIsPlaceholder !== bIsPlaceholder) {
        return aIsPlaceholder ? 1 : -1;
      }
      return (b.priority || 0) - (a.priority || 0);
    });
  }, [matrix.variantsByQuality, selectedQuality]);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    currentServers[0]?.id || ''
  );

  useEffect(() => {
    if (currentServers.length > 0 && !currentServers.some(s => s.id === selectedVariantId)) {
      setSelectedVariantId(currentServers[0]?.id || '');
    }
  }, [currentServers, selectedVariantId]);

  const [hasError, setHasError] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('broken_embed');
  const [reportSuccess, setReportSuccess] = useState(false);
  const playerViewportRef = useRef<HTMLDivElement>(null);

  // Varian aktif
  const activeVariant = useMemo(() => {
    return currentServers.find(v => v.id === selectedVariantId) || currentServers[0];
  }, [currentServers, selectedVariantId]);

  // Adapter untuk embed URL
  const adapter = useMemo(() => {
    if (!activeVariant) return null;
    const isYt = activeVariant.providerId.includes('muse') || 
                 activeVariant.providerId.includes('anione') || 
                 activeVariant.embedUrl.includes('youtube') ||
                 activeVariant.embedUrl.includes('youtu.be');
    return getVideoAdapter(isYt ? 'youtube' : 'custom_embed');
  }, [activeVariant]);

  // Ganti resolusi
  const handleQualityChange = (q: QualityLabel) => {
    setSelectedQuality(q);
    setHasError(false);
    const serversInQ = matrix.variantsByQuality[q] || [];
    if (serversInQ.length > 0) {
      setSelectedVariantId(serversInQ[0].id);
    }
  };

  // Ganti server
  const handleServerChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    setHasError(false);
  };

  // Coba server lain di resolusi yang sama jika error
  const handleTryNextServer = () => {
    const currentIndex = currentServers.findIndex(v => v.id === activeVariant?.id);
    const nextServer = currentServers[(currentIndex + 1) % currentServers.length];
    if (nextServer) {
      setSelectedVariantId(nextServer.id);
      setHasError(false);
    }
  };

  // Dengarkan pesan failover dari embed iframe player jika ada kendala
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'ANIME_HOME_NEXT_SERVER') {
        handleTryNextServer();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentServers, activeVariant]);

  const handleToggleWatched = () => {
    markEpisodeWatched(animeId, episodeId, !isWatched, activeVariant?.id);
    setIsWatched(!isWatched);
  };

  const handleToggleFullscreen = () => {
    if (!playerViewportRef.current) return;
    if (!document.fullscreenElement) {
      playerViewportRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVariant) return;
    db.reportBrokenStream({
      variantId: activeVariant.id,
      episodeId,
      reason: reportReason as any,
    });
    setReportSuccess(true);
    setTimeout(() => {
      setIsReportOpen(false);
      setReportSuccess(false);
    }, 1500);
  };

  if (!matrix.qualities.length || !activeVariant) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-zinc-950 border border-white/[0.08] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-semibold text-zinc-300">Video belum tersedia untuk episode ini.</p>
      </div>
    );
  }

  // URL terproteksi mengarah ke internal gateway (tiket terenkripsi)
  const embedUrl = activeVariant.embedUrl;

  return (
    <>
      {/* Light Dimmer Overlay */}
      {isDimmed && (
        <div
          onClick={() => setIsDimmed(false)}
          className="fixed inset-0 z-40 bg-black/90 backdrop-blur-xs transition-opacity cursor-pointer"
          title="Klik di mana saja untuk menyalakan lampu kembali"
        />
      )}

      <div className={`flex flex-col w-full gap-4 transition-all duration-300 ${
        isDimmed ? 'relative z-50' : ''
      } ${
        isTheaterMode ? 'sm:-mx-8 lg:-mx-20 sm:w-[calc(100%+4rem)] lg:w-[calc(100%+10rem)]' : ''
      }`}>
        {/* 1. VIDEO PLAYER VIEWPORT (16:9) WITH ANTI-SCRAPE SHIELD */}
        <div
          ref={playerViewportRef}
          onContextMenu={(e) => e.preventDefault()}
          className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/[0.08] shadow-2xl select-none"
        >
          {/* Branded Top Mask Overlay to hide embed filenames and watermarks */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 z-20">
            <div className="h-10 bg-[#090A0F] flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-xs font-bold text-white tracking-wide truncate max-w-[240px] sm:max-w-md">
                  ANIME HOME • {animeTitle} — Ep {episodeNumber}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-zinc-400 shrink-0 hidden sm:inline">
                Takarir Indonesia
              </span>
            </div>
            <div className="h-3 bg-gradient-to-b from-[#090A0F] to-transparent" />
          </div>

          {!hasError ? (
            <iframe
              key={activeVariant.id}
              src={embedUrl}
              title={`${animeTitle} - Ep ${episodeNumber}`}
              className="h-full w-full border-0 select-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            />
          ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <p className="text-sm font-bold text-white">Server ini tidak dapat memutar video</p>
            <p className="text-xs text-zinc-400 mt-1">Coba gunakan server cadangan lain di resolusi {selectedQuality}.</p>
            <div className="mt-4 flex items-center gap-2">
              {currentServers.length > 1 && (
                <button
                  onClick={handleTryNextServer}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                >
                  Ganti Server Lain ({selectedQuality})
                </button>
              )}
              <button
                onClick={() => setHasError(false)}
                className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:text-white"
              >
                Muat Ulang
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. RESOLUTION & SERVER SELECTOR (PROMINENT & INTUITIVE) */}
      <div className="flex flex-col gap-3.5 rounded-xl bg-zinc-900/90 border border-white/[0.08] p-4">
        {/* ROW 1: RESOLUSI */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400 mr-1 min-w-[65px]">
            Resolusi:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {matrix.qualities.map((q) => {
              const isSelected = selectedQuality === q;
              return (
                <button
                  key={q}
                  onClick={() => handleQualityChange(q)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {q}
                </button>
              );
            })}
          </div>
        </div>

        {/* ROW 2: PILIH SERVER (MULTI-PROVIDER DI RESOLUSI AKTIF) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
          <span className="text-xs font-semibold text-zinc-400 mr-1 min-w-[65px]">
            Server:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {currentServers.map((server, idx) => {
              const isSelected = server.id === activeVariant?.id;
              // Bersihkan nama server agar ramah pengguna
              const cleanName = server.providerName.replace(/\(.*?\)/g, '').trim();

              return (
                <button
                  key={server.id}
                  onClick={() => handleServerChange(server.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <span>{server.providerName || `Server ${idx + 1}`}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-black" />}
                </button>
              );
            })}
            {currentServers.length === 1 && (
              <span className="text-[11px] text-zinc-500 italic ml-1 self-center">
                (Sumber tunggal resmi terverifikasi)
              </span>
            )}
          </div>
        </div>

        {/* ROW 3: AKSI RINGKAS (TANDAI SELESAI, THEATER, DIMMER & LAPOR) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleWatched}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
                isWatched
                  ? 'bg-zinc-800 text-emerald-400 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {isWatched ? '✓ Sudah Ditonton' : 'Tandai Selesai Nonton'}
            </button>

            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors cursor-pointer ${
                isTheaterMode 
                  ? 'bg-zinc-800 border-white/[0.2] text-white font-semibold' 
                  : 'border-white/[0.06] bg-zinc-950 text-zinc-400 hover:text-white'
              }`}
              title="Mode Teater (Perlebar layar)"
            >
              {isTheaterMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isTheaterMode ? 'Mode Standar' : 'Mode Teater'}</span>
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-zinc-950 px-2.5 py-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Layar Penuh (Fullscreen)"
            >
              <Maximize2 className="h-3.5 w-3.5 text-zinc-300" />
              <span className="hidden sm:inline">Layar Penuh</span>
            </button>

            <button
              onClick={() => setIsDimmed(!isDimmed)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors cursor-pointer ${
                isDimmed 
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold' 
                  : 'border-white/[0.06] bg-zinc-950 text-zinc-400 hover:text-white'
              }`}
              title="Matikan / Nyalakan Lampu"
            >
              {isDimmed ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isDimmed ? 'Nyalakan Lampu' : 'Matikan Lampu'}</span>
            </button>

            {nextEpisodeId && (
              <a
                href={`/watch/${nextEpisodeId}`}
                className="flex items-center gap-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white font-bold px-3 py-1.5 transition-colors cursor-pointer text-xs shadow-xs"
                title={`Lanjut ke Episode ${nextEpisodeNumber || ''}`}
              >
                <span>Ep {nextEpisodeNumber || 'Berikutnya'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <button
            onClick={() => setIsReportOpen(true)}
            className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
          >
            <Flag className="h-3 w-3" />
            <span>Lapor Video Rusak</span>
          </button>
        </div>
      </div>

      {/* REPORT MODAL */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700 p-5">
            <h3 className="text-sm font-bold text-white mb-2">Laporkan Masalah Video</h3>
            {reportSuccess ? (
              <p className="text-xs text-emerald-400 py-3">Laporan terkirim. Terima kasih.</p>
            ) : (
              <form onSubmit={handleSubmitReport} className="flex flex-col gap-3">
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-xs text-white"
                >
                  <option value="broken_embed">Video tidak bisa diputar</option>
                  <option value="wrong_episode">Salah episode</option>
                  <option value="subtitle_issue">Subtitle tidak muncul</option>
                  <option value="other">Masalah lain</option>
                </select>
                <div className="flex justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                  >
                    Kirim
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
