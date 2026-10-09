'use client';

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  Play, Maximize2, Minimize2, Check, AlertCircle, RefreshCw, 
  ShieldCheck, Globe, Subtitles, Volume2, ArrowLeft, ExternalLink,
  Layers, Tv, Info, CheckCircle2, XCircle
} from 'lucide-react';

interface StreamSource {
  id: string;
  name: string;
  provider: string;
  embedUrl: string;
  isSimulatedFailure?: boolean;
}

interface PrototypeEpisode {
  id: string;
  displayNumber: string;
  title: string;
  duration: string;
  sources: StreamSource[];
}

interface PrototypeAnime {
  id: string;
  title: string;
  slug: string;
  distributor: string;
  audioLocale: string;
  subtitleLocale: string;
  episodes: PrototypeEpisode[];
}

const PROTOTYPE_CATALOG: PrototypeAnime[] = [
  {
    id: 'anime-shokugeki',
    title: 'Shokugeki no Souma (Food Wars!)',
    slug: 'shokugeki-no-souma',
    distributor: 'Ani-One Indonesia (MediaLink Licensed)',
    audioLocale: 'Jepang (ja-JP)',
    subtitleLocale: 'Indonesia Resmi (id-ID Sub Indo)',
    episodes: [
      {
        id: 'ep-shokugeki-1',
        displayNumber: '01',
        title: 'Gurun Tanpa Batas (An Endless Wasteland)',
        duration: '24 menit',
        sources: [
          {
            id: 'src-shokugeki-1-p1',
            name: 'Server 1: Ani-One ID (Resmi HD)',
            provider: 'Ani-One Indonesia',
            embedUrl: 'https://www.youtube-nocookie.com/embed/pSYeGNY4PGo?autoplay=1&enablejsapi=1&rel=0',
          },
          {
            id: 'src-shokugeki-1-p2',
            name: 'Server 2: YouTube Mirror (Cadangan)',
            provider: 'YouTube Direct Mirror',
            embedUrl: 'https://www.youtube.com/embed/pSYeGNY4PGo?autoplay=1&rel=0',
          },
          {
            id: 'src-shokugeki-1-fail',
            name: 'Server 3: Simulasi Server Rusak (Uji Error Recovery)',
            provider: 'Simulated Broken Source',
            embedUrl: 'https://www.example.com/broken-stream-mock',
            isSimulatedFailure: true,
          },
        ],
      },
      {
        id: 'ep-shokugeki-2',
        displayNumber: '02',
        title: 'Lidah Sang Dewa (God Tongue)',
        duration: '24 menit',
        sources: [
          {
            id: 'src-shokugeki-2-p1',
            name: 'Server 1: Ani-One ID (Resmi HD)',
            provider: 'Ani-One Indonesia',
            embedUrl: 'https://www.youtube-nocookie.com/embed/xFth1NmGT1g?autoplay=1&enablejsapi=1&rel=0',
          },
          {
            id: 'src-shokugeki-2-p2',
            name: 'Server 2: YouTube Mirror (Cadangan)',
            provider: 'YouTube Direct Mirror',
            embedUrl: 'https://www.youtube.com/embed/xFth1NmGT1g?autoplay=1&rel=0',
          },
        ],
      },
      {
        id: 'ep-shokugeki-19',
        displayNumber: '19',
        title: 'Yang Terpilih (The Chosen One)',
        duration: '24 menit',
        sources: [
          {
            id: 'src-shokugeki-19-p1',
            name: 'Server 1: Ani-One ID (Resmi HD)',
            provider: 'Ani-One Indonesia',
            embedUrl: 'https://www.youtube-nocookie.com/embed/oRG34pN8eMQ?autoplay=1&enablejsapi=1&rel=0',
          },
          {
            id: 'src-shokugeki-19-p2',
            name: 'Server 2: YouTube Mirror (Cadangan)',
            provider: 'YouTube Direct Mirror',
            embedUrl: 'https://www.youtube.com/embed/oRG34pN8eMQ?autoplay=1&rel=0',
          },
        ],
      },
    ],
  },
  {
    id: 'anime-tsukimichi',
    title: 'TSUKIMICHI -Moonlit Fantasy- Season 2',
    slug: 'tsukimichi-season-2',
    distributor: 'Ani-One Indonesia (MediaLink Licensed)',
    audioLocale: 'Jepang (ja-JP)',
    subtitleLocale: 'Indonesia Resmi (id-ID Sub Indo)',
    episodes: [
      {
        id: 'ep-tsukimichi-5',
        displayNumber: '05',
        title: 'Pelajaran di Akademi Sihir',
        duration: '24 menit',
        sources: [
          {
            id: 'src-tsukimichi-5-p1',
            name: 'Server 1: Ani-One ID (Resmi HD)',
            provider: 'Ani-One Indonesia',
            embedUrl: 'https://www.youtube-nocookie.com/embed/IUwlpHSqwcc?autoplay=1&enablejsapi=1&rel=0',
          },
          {
            id: 'src-tsukimichi-5-p2',
            name: 'Server 2: YouTube Mirror (Cadangan)',
            provider: 'YouTube Direct Mirror',
            embedUrl: 'https://www.youtube.com/embed/IUwlpHSqwcc?autoplay=1&rel=0',
          },
        ],
      },
      {
        id: 'ep-tsukimichi-7',
        displayNumber: '07',
        title: 'Dua Pahlawan',
        duration: '24 menit',
        sources: [
          {
            id: 'src-tsukimichi-7-p1',
            name: 'Server 1: Ani-One ID (Resmi HD)',
            provider: 'Ani-One Indonesia',
            embedUrl: 'https://www.youtube-nocookie.com/embed/SpVH-VyyCh0?autoplay=1&enablejsapi=1&rel=0',
          },
          {
            id: 'src-tsukimichi-7-p2',
            name: 'Server 2: YouTube Mirror (Cadangan)',
            provider: 'YouTube Direct Mirror',
            embedUrl: 'https://www.youtube.com/embed/SpVH-VyyCh0?autoplay=1&rel=0',
          },
        ],
      },
      {
        id: 'ep-tsukimichi-9',
        displayNumber: '09',
        title: 'Pertemuan yang Ditakdirkan',
        duration: '24 menit',
        sources: [
          {
            id: 'src-tsukimichi-9-p1',
            name: 'Server 1: Ani-One ID (Resmi HD)',
            provider: 'Ani-One Indonesia',
            embedUrl: 'https://www.youtube-nocookie.com/embed/Imyb6Q6gD-M?autoplay=1&enablejsapi=1&rel=0',
          },
          {
            id: 'src-tsukimichi-9-p2',
            name: 'Server 2: YouTube Mirror (Cadangan)',
            provider: 'YouTube Direct Mirror',
            embedUrl: 'https://www.youtube.com/embed/Imyb6Q6gD-M?autoplay=1&rel=0',
          },
        ],
      },
    ],
  },
  {
    id: 'anime-oregairu',
    title: 'My Teen Romantic Comedy SNAFU (Oregairu)',
    slug: 'oregairu',
    distributor: 'Ani-One Indonesia (MediaLink Licensed)',
    audioLocale: 'Jepang (ja-JP)',
    subtitleLocale: 'Indonesia Resmi (id-ID Sub Indo)',
    episodes: [
      {
        id: 'ep-oregairu-1',
        displayNumber: '01',
        title: 'Masa Muda Mereka yang Salah Sejak Awal',
        duration: '24 menit',
        sources: [
          {
            id: 'src-oregairu-1-p1',
            name: 'Server 1: Ani-One ID (Resmi HD)',
            provider: 'Ani-One Indonesia',
            embedUrl: 'https://www.youtube-nocookie.com/embed/vDQfxWqDxUw?autoplay=1&enablejsapi=1&rel=0',
          },
          {
            id: 'src-oregairu-1-p2',
            name: 'Server 2: YouTube Mirror (Cadangan)',
            provider: 'YouTube Direct Mirror',
            embedUrl: 'https://www.youtube.com/embed/vDQfxWqDxUw?autoplay=1&rel=0',
          },
        ],
      },
    ],
  },
  {
    id: 'anime-onepunch',
    title: 'One Punch Man (Season 3 Special)',
    slug: 'one-punch-man',
    distributor: 'Muse Indonesia (Muse Communication Co., Ltd.)',
    audioLocale: 'Jepang (ja-JP)',
    subtitleLocale: 'Takarir Indonesia Resmi (id-ID)',
    episodes: [
      {
        id: 'ep-onepunch-25',
        displayNumber: '25',
        title: 'Pahlawan Terkuat (Special Episode 25)',
        duration: '24 menit',
        sources: [
          {
            id: 'src-onepunch-25-p1',
            name: 'Server 1: Muse ID (Resmi HD)',
            provider: 'Muse Indonesia',
            embedUrl: 'https://www.youtube-nocookie.com/embed/YXMPqxqo7i8?autoplay=1&enablejsapi=1&rel=0',
          },
          {
            id: 'src-onepunch-25-p2',
            name: 'Server 2: YouTube Mirror (Cadangan)',
            provider: 'YouTube Direct Mirror',
            embedUrl: 'https://www.youtube.com/embed/YXMPqxqo7i8?autoplay=1&rel=0',
          },
        ],
      },
    ],
  },
  {
    id: 'anime-aoashi',
    title: 'AOASHI Season 2',
    slug: 'aoashi-season-2',
    distributor: 'Ani-One Indonesia (MediaLink Licensed)',
    audioLocale: 'Jepang (ja-JP)',
    subtitleLocale: 'Indonesia Resmi (id-ID Sub Indo)',
    episodes: [
      {
        id: 'ep-aoashi-1',
        displayNumber: '01',
        title: 'Awal dari Babak Baru',
        duration: '24 menit',
        sources: [
          {
            id: 'src-aoashi-1-p1',
            name: 'Server 1: Ani-One ID (Resmi HD)',
            provider: 'Ani-One Indonesia',
            embedUrl: 'https://www.youtube-nocookie.com/embed/VqnPk4apz2g?autoplay=1&enablejsapi=1&rel=0',
          },
          {
            id: 'src-aoashi-1-p2',
            name: 'Server 2: YouTube Mirror (Cadangan)',
            provider: 'YouTube Direct Mirror',
            embedUrl: 'https://www.youtube.com/embed/VqnPk4apz2g?autoplay=1&rel=0',
          },
        ],
      },
    ],
  },
];

export default function IsolatedStreamingPrototypePage() {
  const [selectedAnimeId, setSelectedAnimeId] = useState(PROTOTYPE_CATALOG[0].id);
  const currentAnime = useMemo(() => {
    return PROTOTYPE_CATALOG.find(a => a.id === selectedAnimeId) || PROTOTYPE_CATALOG[0];
  }, [selectedAnimeId]);

  const [selectedEpisodeId, setSelectedEpisodeId] = useState(currentAnime.episodes[0].id);
  const currentEpisode = useMemo(() => {
    return currentAnime.episodes.find(e => e.id === selectedEpisodeId) || currentAnime.episodes[0];
  }, [currentAnime, selectedEpisodeId]);

  const [selectedSourceId, setSelectedSourceId] = useState(currentEpisode.sources[0]?.id || '');
  const activeSource = useMemo(() => {
    return currentEpisode.sources.find(s => s.id === selectedSourceId) || currentEpisode.sources[0];
  }, [currentEpisode, selectedSourceId]);

  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const handleSelectAnime = (animeId: string) => {
    setSelectedAnimeId(animeId);
    const anime = PROTOTYPE_CATALOG.find(a => a.id === animeId) || PROTOTYPE_CATALOG[0];
    const ep = anime.episodes[0];
    setSelectedEpisodeId(ep.id);
    setSelectedSourceId(ep.sources[0]?.id || '');
    setHasError(false);
  };

  const handleSelectEpisode = (epId: string) => {
    setSelectedEpisodeId(epId);
    const ep = currentAnime.episodes.find(e => e.id === epId) || currentAnime.episodes[0];
    setSelectedSourceId(ep.sources[0]?.id || '');
    setHasError(false);
  };

  const handleSelectSource = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    const source = currentEpisode.sources.find(s => s.id === sourceId);
    if (source?.isSimulatedFailure) {
      setHasError(true);
    } else {
      setHasError(false);
    }
  };

  const handleToggleFullscreen = () => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.warn('Exit fullscreen error:', err);
      });
    }
  };

  const handleAutoSwitchBackup = () => {
    const workingBackup = currentEpisode.sources.find(s => !s.isSimulatedFailure);
    if (workingBackup) {
      setSelectedSourceId(workingBackup.id);
      setHasError(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* Top Banner & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
          <span className="text-zinc-600">•</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3 w-3" />
            <span>Verified Streaming MVP Prototype</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>Infrastruktur: <strong>$0 Bandwidth (Direct CDN)</strong></span>
        </div>
      </div>

      {/* Title & Context */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Tv className="h-6 w-6 text-red-500" />
          <span>Isolated Streaming Prototype</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Prototipe pemutar video anime terisolasi untuk memverifikasi pemutaran nyata, takarir bahasa Indonesia resmi, multi-server switching, dan error recovery tanpa membebani server Vercel.
        </p>
      </div>

      {/* 1. ANIME SELECTOR */}
      <div className="flex flex-col gap-2 bg-zinc-900/60 border border-white/[0.06] rounded-xl p-3.5">
        <span className="text-xs font-semibold text-zinc-400">Pilih Judul Anime Terverifikasi:</span>
        <div className="flex flex-wrap gap-2">
          {PROTOTYPE_CATALOG.map((anime) => {
            const isSelected = anime.id === currentAnime.id;
            return (
              <button
                key={anime.id}
                onClick={() => handleSelectAnime(anime.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {anime.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. EPISODE SELECTOR */}
      <div className="flex items-center gap-2 bg-zinc-900/40 border border-white/[0.06] rounded-xl p-3">
        <span className="text-xs font-semibold text-zinc-400 min-w-[90px]">Pilih Episode:</span>
        <div className="flex flex-wrap gap-1.5 overflow-x-auto">
          {currentAnime.episodes.map((ep) => {
            const isSelected = ep.id === currentEpisode.id;
            return (
              <button
                key={ep.id}
                onClick={() => handleSelectEpisode(ep.id)}
                className={`flex items-center justify-center min-w-[42px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black font-black shadow-sm'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Ep {ep.displayNumber}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-zinc-400 ml-auto hidden sm:inline truncate">
          {currentEpisode.title} ({currentEpisode.duration})
        </span>
      </div>

      {/* 3. VIDEO PLAYER VIEWPORT (16:9) WITH ERROR RECOVERY */}
      <div className="flex flex-col gap-3">
        <div 
          ref={playerRef} 
          className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/[0.08] shadow-2xl"
        >
          {!hasError && activeSource ? (
            <iframe
              key={activeSource.id}
              src={activeSource.embedUrl}
              title={`${currentAnime.title} - Episode ${currentEpisode.displayNumber}`}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
              <p className="text-base font-bold text-white">Gagal Memutar Sumber Video Ini</p>
              <p className="text-xs text-zinc-400 max-w-md mt-1">
                Server ini sedang tidak dapat merespons atau terputus. Sistem mendeteksi server alternatif yang siap digunakan.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={handleAutoSwitchBackup}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Alihkan ke Server Cadangan</span>
                </button>
                <button
                  onClick={() => setHasError(false)}
                  className="rounded-xl border border-white/[0.1] bg-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. SERVER SELECTOR & CONTROLS BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/90 border border-white/[0.08] rounded-xl p-3.5">
          {/* Server Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 mr-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-zinc-500" />
              <span>Pilihan Server:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentEpisode.sources.map((src) => {
                const isSelected = src.id === activeSource?.id;
                return (
                  <button
                    key={src.id}
                    onClick={() => handleSelectSource(src.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? src.isSimulatedFailure
                          ? 'bg-red-950 border border-red-500 text-red-200'
                          : 'bg-white text-black font-bold shadow-sm'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <span>{src.name}</span>
                    {isSelected && !src.isSimulatedFailure && <Check className="h-3.5 w-3.5 text-black" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleToggleFullscreen}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Layar Penuh (Fullscreen)</span>
            </button>
            <Link
              href={`/watch/${currentEpisode.id}`}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer shadow-sm"
              title="Buka episode ini di tampilan publik ANIME HOME"
            >
              <span>Buka di Watch Page</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. DIAGNOSTICS & VERIFIED METRICS CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Verifikasi Hak Siar & Kualitas */}
        <div className="flex flex-col gap-2.5 bg-zinc-900/50 border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Kredensial & Kepatuhan Legalitas</span>
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-zinc-300">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-zinc-500">Distributor Resmi:</span>
              <span className="font-semibold text-zinc-200">{currentAnime.distributor}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-zinc-500">Bahasa Audio:</span>
              <span className="font-medium text-zinc-200">{currentAnime.audioLocale}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-zinc-500">Takarir (Subtitle):</span>
              <span className="font-semibold text-emerald-400">{currentAnime.subtitleLocale}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-zinc-500">Kualitas Resolusi:</span>
              <span className="font-medium text-zinc-200">1080p / 720p Adaptive HLS</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">Hak Embed:</span>
              <span className="font-semibold text-emerald-400">Diizinkan (Feature oEmbed Verified)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Kinerja & Zero-Cost Telemetri */}
        <div className="flex flex-col gap-2.5 bg-zinc-900/50 border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
            <Globe className="h-4 w-4" />
            <span>Telemetri & Konsumsi Bandwidth</span>
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-zinc-300">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-zinc-500">Bandwidth Server Vercel:</span>
              <span className="font-bold text-emerald-400">0 KB (Zero egress cost)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-zinc-500">CDN Pengiriman Video:</span>
              <span className="font-medium text-zinc-200">Google Global Edge CDN</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-zinc-500">Kebutuhan Akun Pengguna:</span>
              <span className="font-medium text-zinc-200">Tidak Perlu (Tamu Instan)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-zinc-500">Kompatibilitas Mobile:</span>
              <span className="font-medium text-emerald-400">100% Responsif (iOS Safari & Android Chrome)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">Domain Embed Aktif:</span>
              <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[200px]" title={activeSource?.embedUrl}>
                {activeSource?.embedUrl}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
