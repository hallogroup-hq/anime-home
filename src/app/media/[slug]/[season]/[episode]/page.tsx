import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HostedVideoPlayer, type HostedSubtitle } from '@/components/player/HostedVideoPlayer';

interface HostedEpisode {
  number: number;
  durationSeconds: number;
  playlistUrl: string;
  mp4Url: string;
  subtitles: HostedSubtitle[];
}

interface HostedManifest {
  version: number;
  animeSlug: string;
  seasonNumber: number;
  expectedEpisodes: number;
  airedEpisodes: number;
  readiness: string;
  episodes: HostedEpisode[];
}

function validVideoUrl(raw: unknown, prefix: string) {
  if (typeof raw !== 'string') return false;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && raw.startsWith(prefix + '/');
  } catch {
    return false;
  }
}

async function getPublishedSeason(
  slug: string,
  seasonNumber: number,
): Promise<HostedManifest | null> {
  const configuredBase = process.env.MEDIA_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE_URL;
  if (!configuredBase) return null;
  let base: URL;
  try {
    base = new URL(configuredBase);
    if (base.protocol !== 'https:') return null;
  } catch {
    return null;
  }

  const prefix = base.toString().replace(/\/+$/, '') +
    '/media/' + slug + '/season-' + String(seasonNumber).padStart(2, '0');
  let response: Response;
  try {
    response = await fetch(prefix + '/published-manifest.json', {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const value = parsed as Partial<HostedManifest>;
  if (value.animeSlug !== slug || value.seasonNumber !== seasonNumber ||
      !['READY_COMPLETE', 'READY_ONGOING'].includes(value.readiness || '') ||
      !Array.isArray(value.episodes) ||
      !Number.isSafeInteger(value.expectedEpisodes) ||
      !Number.isSafeInteger(value.airedEpisodes) ||
      !value.episodes.length) return null;

  const episodes: HostedEpisode[] = [];
  const seen = new Set<number>();
  for (const candidate of value.episodes) {
    if (!candidate || !Number.isSafeInteger(candidate.number) || candidate.number < 1 ||
      seen.has(candidate.number) ||
      !validVideoUrl(candidate.mp4Url, prefix) ||
      !validVideoUrl(candidate.playlistUrl, prefix) ||
      !Array.isArray(candidate.subtitles) ||
      !candidate.subtitles.every((track: HostedSubtitle) =>
        typeof track.locale === 'string' && validVideoUrl(track.url, prefix))) return null;
    seen.add(candidate.number);
    episodes.push(candidate);
  }
  episodes.sort((a, b) => a.number - b.number);
  // A published manifest must actually contain every aired episode without gaps.
  const available = value.readiness === 'READY_ONGOING' ? value.airedEpisodes! : value.expectedEpisodes!;
  if (episodes.length !== available ||
    !episodes.every((episode, i) => episode.number === i + 1)) return null;

  return value as HostedManifest;
}

interface PageProps {
  params: Promise<{ slug: string; season: string; episode: string }>;
}

export default async function HostedEpisodePage({ params }: PageProps) {
  const { slug, season, episode } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100 ||
      !/^\d{1,3}$/.test(season) || !/^\d{1,4}$/.test(episode)) notFound();

  const seasonNumber = Number(season);
  const episodeNumber = Number(episode);
  if (seasonNumber < 1 || episodeNumber < 1) notFound();

  const manifest = await getPublishedSeason(slug, seasonNumber);
  if (!manifest) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-zinc-200">
        <h1 className="text-2xl font-bold">Video belum tersedia</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Season ini belum diunggah atau koneksi storage belum dikonfigurasi.
        </p>
        <Link href="/" className="mt-6 inline-block text-red-400 hover:underline">Kembali ke beranda</Link>
      </main>
    );
  }

  const selected = manifest.episodes.find(e => e.number === episodeNumber);
  if (!selected) notFound();

  const baseHref = '/media/' + slug + '/' + seasonNumber + '/';
  const next = manifest.episodes.find(e => e.number === episodeNumber + 1);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-20 text-white">
      <div>
        <Link href="/" className="text-xs text-zinc-400 hover:text-white">← ANIME HOME</Link>
        <h1 className="mt-3 text-xl font-bold sm:text-2xl">
          {slug.replaceAll('-', ' ')} · Season {seasonNumber} · Episode {episodeNumber}
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          {manifest.readiness === 'READY_COMPLETE'
            ? 'Season lengkap'
            : 'Ongoing'} · {manifest.episodes.length} episode tersedia
        </p>
      </div>

      <HostedVideoPlayer
        title={slug + ' episode ' + episodeNumber}
        mp4Url={selected.mp4Url}
        playlistUrl={selected.playlistUrl}
        subtitles={selected.subtitles}
        nextEpisodeHref={next ? baseHref + next.number : undefined}
      />

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-200">Daftar Episode</h2>
        <div className="flex flex-wrap gap-2">
          {manifest.episodes.map(e => (
            <Link
              key={e.number}
              href={baseHref + e.number}
              aria-current={e.number === episodeNumber ? 'page' : undefined}
              className={'rounded-lg border px-4 py-2 text-sm font-medium ' +
                (e.number === episodeNumber
                  ? 'border-red-500 bg-red-600 text-white'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800')}
            >
              Ep {String(e.number).padStart(2, '0')}
            </Link>
          ))}
        </div>
      </div>
      {next && (
        <Link href={baseHref + next.number} className="inline-flex rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold">
          Episode Selanjutnya →
        </Link>
      )}
    </main>
  );
}
