'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export interface HostedSubtitle {
  locale: string;
  url: string;
}

interface HostedVideoPlayerProps {
  mp4Url: string;
  playlistUrl: string;
  subtitles: HostedSubtitle[];
  title: string;
  nextEpisodeHref?: string;
}

export function HostedVideoPlayer({
  mp4Url,
  playlistUrl,
  subtitles,
  title,
  nextEpisodeHref,
}: HostedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState(mp4Url);
  const [error, setError] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    // Safari supports native HLS. Chrome/Firefox use progressive MP4 in this pilot.
    const hasNativeHls = Boolean(
      video?.canPlayType('application/vnd.apple.mpegurl') ||
      video?.canPlayType('application/x-mpegURL'),
    );
    setSource(hasNativeHls ? playlistUrl : mp4Url);
    setError(false);
    setFinished(false);
  }, [mp4Url, playlistUrl]);

  const handleError = () => {
    if (source !== mp4Url) {
      // Try compatible progressive MP4 if the native HLS pipeline fails.
      setSource(mp4Url);
      setError(false);
      return;
    }
    setError(true);
  };

  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-xl bg-black border border-white/10">
        <video
          key={source}
          ref={videoRef}
          className="aspect-video w-full bg-black"
          src={source}
          controls
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          onError={handleError}
          onEnded={() => setFinished(true)}
          aria-label={title}
        >
          {subtitles.map((track, i) => (
            <track
              key={track.locale}
              kind="subtitles"
              src={track.url}
              srcLang={track.locale}
              label={track.locale.startsWith('id') ? 'Bahasa Indonesia' : 'English'}
              default={i === 0}
            />
          ))}
          Browser kamu tidak mendukung pemutaran video HTML5.
        </video>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">
          Video belum bisa diputar. Pastikan objek media tersedia dan domain storage mengizinkan akses video serta subtitle.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <span>Player ANIME HOME · Video dari storage sendiri · Tidak menggunakan YouTube</span>
        {source === playlistUrl ? <span>HLS native</span> : <span>MP4 fallback</span>}
      </div>

      {finished && nextEpisodeHref && (
        <Link
          href={nextEpisodeHref}
          className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Lanjut episode berikutnya
        </Link>
      )}
    </section>
  );
}
