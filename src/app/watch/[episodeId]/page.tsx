import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/services/store';
import { WatchClient } from '@/components/player/WatchClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anime-home-psi.vercel.app';

interface PageProps {
  params: Promise<{ episodeId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { episodeId } = await params;
  let episode = db.getEpisodeById(episodeId);

  if (!episode) {
    try {
      const { TursoService } = await import('@/lib/services/tursoService');
      const direct = await TursoService.getEpisodeById(episodeId);
      if (direct) {
        episode = direct;
        db.registerEpisode(direct);
      }
    } catch {}
  }

  if (!episode) {
    return {
      title: 'Episode Tidak Ditemukan',
      description: 'Episode anime yang Anda cari tidak tersedia di Anime Home.',
    };
  }

  let anime = db.getAnimeList().find((a) => a.id === episode.animeId);
  if (!anime) {
    try {
      const { TursoService } = await import('@/lib/services/tursoService');
      const allAnime = await TursoService.getAllAnime();
      const match = allAnime.find((a) => a.id === episode.animeId);
      if (match) {
        anime = match;
        db.registerAnime(match);
      }
    } catch {}
  }

  if (!anime) {
    return {
      title: 'Anime Tidak Ditemukan',
      description: 'Anime tidak ditemukan di Anime Home.',
    };
  }

  const pageTitle = `Nonton ${anime.canonicalTitle} Episode ${episode.displayNumber} Sub Indo`;
  const pageDescription = `Nonton streaming ${anime.canonicalTitle} Episode ${episode.displayNumber} (${episode.title}) subtitle Indonesia full HD 1080p, 720p di Anime Home. Streaming anime sub Indo multi-server lancar tanpa buffer.`;
  const canonicalUrl = `${siteUrl}/watch/${episode.id}`;
  const bannerUrl = anime.bannerUrl.startsWith('http') ? anime.bannerUrl : `${siteUrl}${anime.bannerUrl}`;
  const posterUrl = anime.posterUrl.startsWith('http') ? anime.posterUrl : `${siteUrl}${anime.posterUrl}`;

  const keywords = [
    `nonton ${anime.canonicalTitle.toLowerCase()} episode ${episode.displayNumber} sub indo`,
    `streaming ${anime.canonicalTitle.toLowerCase()} episode ${episode.displayNumber} sub indo`,
    `${anime.canonicalTitle.toLowerCase()} episode ${episode.displayNumber} subtitle indonesia`,
    `${anime.canonicalTitle.toLowerCase()} ep ${episode.displayNumber} sub indo`,
    `streaming ${anime.canonicalTitle.toLowerCase()} episode ${episode.displayNumber}`,
    `download ${anime.canonicalTitle.toLowerCase()} episode ${episode.displayNumber} sub indo`,
    `nonton anime ${anime.canonicalTitle.toLowerCase()} sub indo`,
    'streaming anime',
    'streaming anime sub indo',
    'nonton anime sub indo',
    'anime sub indo',
    'anime home',
  ];

  return {
    title: pageTitle,
    description: pageDescription,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: 'Anime Home',
      locale: 'id_ID',
      type: 'video.episode',
      images: [
        {
          url: bannerUrl || posterUrl,
          width: 1200,
          height: 630,
          alt: `${anime.canonicalTitle} Episode ${episode.displayNumber}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [bannerUrl || posterUrl],
      creator: '@AnimeHomeID',
    },
  };
}

export default async function WatchPage({ params }: PageProps) {
  const { episodeId } = await params;
  let episode = db.getEpisodeById(episodeId);

  if (!episode) {
    try {
      const { TursoService } = await import('@/lib/services/tursoService');
      const direct = await TursoService.getEpisodeById(episodeId);
      if (direct) {
        episode = direct;
        db.registerEpisode(direct);
      }
    } catch (err) {
      console.warn('[WatchPage] Turso episode fallback failed:', err);
    }
  }

  if (!episode) {
    notFound();
  }

  let anime = db.getAnimeList().find((a) => a.id === episode.animeId);
  if (!anime) {
    try {
      const { TursoService } = await import('@/lib/services/tursoService');
      const allAnime = await TursoService.getAllAnime();
      const match = allAnime.find((a) => a.id === episode.animeId);
      if (match) {
        anime = match;
        db.registerAnime(match);
      }
    } catch (err) {
      console.warn('[WatchPage] Turso anime fallback failed:', err);
    }
  }

  if (!anime) {
    notFound();
  }

  const watchOrder = db.getWatchOrderForAnime(anime.id);
  let allEpisodes = db.getEpisodesByAnimeId(anime.id);
  if (allEpisodes.length === 0 || !allEpisodes.some((e) => e.id === episode.id)) {
    try {
      const { TursoService } = await import('@/lib/services/tursoService');
      const tursoEps = await TursoService.getEpisodesByAnimeId(anime.id);
      if (tursoEps.length > 0) {
        allEpisodes = tursoEps;
        for (const ep of tursoEps) {
          db.registerEpisode(ep);
        }
      }
    } catch (err) {
      console.warn('[WatchPage] Turso allEpisodes fallback failed:', err);
    }
  }

  const currentIndex = allEpisodes.findIndex((e) => e.id === episode.id);
  const prevEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

  const pageUrl = `${siteUrl}/watch/${episode.id}`;
  const posterUrl = anime.posterUrl.startsWith('http') ? anime.posterUrl : `${siteUrl}${anime.posterUrl}`;

  // 1. Schema.org TVEpisode & VideoObject
  const jsonLdEpisode = {
    '@context': 'https://schema.org',
    '@type': 'TVEpisode',
    name: `${anime.canonicalTitle} Episode ${episode.displayNumber} - ${episode.title}`,
    episodeNumber: episode.displayNumber,
    description: `Nonton streaming ${anime.canonicalTitle} Episode ${episode.displayNumber} sub Indo di Anime Home.`,
    image: posterUrl,
    inLanguage: 'id',
    url: pageUrl,
    partOfSeries: {
      '@type': 'TVSeries',
      name: anime.canonicalTitle,
      url: `${siteUrl}/anime/${anime.slug}`,
    },
  };

  const jsonLdVideo = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: `${anime.canonicalTitle} Episode ${episode.displayNumber} Sub Indo`,
    description: `${episode.title}. Nonton streaming anime ${anime.canonicalTitle} Episode ${episode.displayNumber} dengan subtitle bahasa Indonesia terverifikasi.`,
    thumbnailUrl: posterUrl,
    uploadDate: episode.airedAt ? new Date(episode.airedAt).toISOString() : '2024-01-01T00:00:00Z',
    inLanguage: 'id',
    url: pageUrl,
    embedUrl: pageUrl,
    potentialAction: {
      '@type': 'WatchAction',
      target: pageUrl,
    },
  };

  // 2. Schema.org BreadcrumbList
  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Katalog Anime',
        item: `${siteUrl}/anime`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: anime.canonicalTitle,
        item: `${siteUrl}/anime/${anime.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: `Episode ${episode.displayNumber}`,
        item: pageUrl,
      },
    ],
  };

  try {
    const { TursoService } = await import('@/lib/services/tursoService');
    const tursoVariants = await TursoService.getVariantsByEpisodeId(episode.id);
    if (tursoVariants.length > 0) {
      db.registerVariants(tursoVariants);
    }
  } catch (err) {
    console.warn('[WatchPage] Turso variants sync failed:', err);
  }

  const secureStreamMatrix = db.getSecureStreamMatrix(episode.id);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdEpisode) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdVideo) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      {/* Semantic GEO text block for AI search crawlers */}
      <section className="sr-only" aria-hidden="false">
        <h2>{anime.canonicalTitle} Episode {episode.displayNumber} Subtitle Indonesia</h2>
        <p>Judul Episode: {episode.title}</p>
        <p>Serial: {anime.canonicalTitle}</p>
        <p>Takarir: Bahasa Indonesia (Sub Indo) Terverifikasi</p>
        <p>Tersedia di Anime Home dengan pemutar multi-server resolusi 360p hingga 1080p.</p>
      </section>

      <WatchClient
        episode={episode}
        anime={anime}
        watchOrder={watchOrder}
        allEpisodes={allEpisodes}
        prevEpisode={prevEpisode}
        nextEpisode={nextEpisode}
        secureStreamMatrix={secureStreamMatrix}
      />
    </>
  );
}
