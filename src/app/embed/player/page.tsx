'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, RotateCcw, AlertTriangle, ShieldCheck, Server } from 'lucide-react';

function EmbedPlayerContent() {
  const searchParams = useSearchParams();
  const title = searchParams.get('title') || 'Anime Stream';
  const ep = searchParams.get('ep') || '1';
  const poster = searchParams.get('poster') || '';
  const server = searchParams.get('server') || 'Server Alpha';
  const videoSrc = searchParams.get('src') || '';
  const quality = searchParams.get('quality') || '720p';

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-failover: if this embed endpoint was requested without a direct stream, notify parent player
  useEffect(() => {
    if (!videoSrc) {
      const timer = setTimeout(() => {
        requestNextServer();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [videoSrc]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setHasError(false);
      }).catch(() => {
        // Autoplay policy or video not ready
        setIsPlaying(false);
      });
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || 0;
    setProgress(total > 0 ? (current / total) * 100 : 0);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
    setIsLoading(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
    setProgress(pos * 100);
  };

  const requestNextServer = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'ANIME_HOME_NEXT_SERVER' }, '*');
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[300px] bg-zinc-950 flex items-center justify-center overflow-hidden select-none group font-sans text-white"
    >
      {/* Video Element */}
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={poster || undefined}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setHasError(true)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => {
            setIsLoading(false);
            setIsPlaying(true);
          }}
          onEnded={() => setIsPlaying(false)}
          playsInline
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-t from-zinc-950 via-zinc-900 to-zinc-950">
          {poster && (
            <img
              src={poster}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm"
            />
          )}
          <div className="relative z-10 max-w-md p-6 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-2xl backdrop-blur-md">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {title} - Episode {ep}
            </h3>
            <div className="flex items-center justify-center gap-2 mb-4 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> {server}
              </span>
              <span className="bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-300">
                {quality}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Koneksi video sedang dimuat dari server multi-source. Jika video belum berputar otomatis, coba ganti ke server cadangan.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={requestNextServer}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Ganti ke Server Cadangan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Fallback Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Server Mengalami Kendala</h4>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            Aliran video pada {server} tidak dapat dimuat. Gunakan server cadangan untuk melanjutkan menonton.
          </p>
          <button
            type="button"
            onClick={requestNextServer}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Coba Server Lain
          </button>
        </div>
      )}

      {/* Top Bar Info Overlay */}
      <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white drop-shadow">{title}</span>
          <span className="text-zinc-400">· Ep {ep}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[11px] font-medium text-emerald-400">
            ● {server}
          </span>
          <span className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 text-[11px] font-mono">
            {quality}
          </span>
        </div>
      </div>

      {/* Bottom Controls Overlay */}
      {videoSrc && (
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
          {/* Progress Bar */}
          <div
            onClick={handleSeek}
            className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-full cursor-pointer relative transition-all"
          >
            <div
              className="h-full bg-red-600 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmbedPlayerPage() {
  return (
    <Suspense fallback={<div className="w-full h-full bg-zinc-950 flex items-center justify-center text-zinc-500">Memuat Pemutar...</div>}>
      <EmbedPlayerContent />
    </Suspense>
  );
}
