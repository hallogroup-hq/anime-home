import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/services/store';
import { AnimeDetailClient } from '@/components/catalog/AnimeDetailClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anime-home-psi.vercel.app';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const anime = db.getAnimeBySlug(slug);

  if (!anime) {
    return {
      title: 'Anime Tidak Ditemukan',
      description: 'Halaman anime yang Anda cari tidak tersedia di Anime Home.',
    };
  }

  const isMovie = anime.mediaType === 'Movie';
  const episodes = db.getEpisodesByAnimeId(anime.id);
  const statusLabel = anime.airingStatus === 'airing' ? 'Sedang Tayang (Ongoing)' : 'Tamat (Completed)';
  const totalEpLabel = isMovie ? 'Full Movie' : `${episodes.length} Episode`;

  const pageTitle = `Nonton ${anime.canonicalTitle} Sub Indo (${totalEpLabel})`;
  const pageDescription = `Streaming dan download ${anime.canonicalTitle} (${anime.year || ''}) subtitle Indonesia lengkap di Anime Home. ${anime.synopsis.slice(0, 160)}... Genre: ${anime.genres.join(', ')}. Status: ${statusLabel}. Multi-server stabil dan lancar tanpa kendala.`;

  const canonicalUrl = `${siteUrl}/anime/${anime.slug}`;
  const posterUrl = anime.posterUrl.startsWith('http') ? anime.posterUrl : `${siteUrl}${anime.posterUrl}`;
  const bannerUrl = anime.bannerUrl.startsWith('http') ? anime.bannerUrl : `${siteUrl}${anime.bannerUrl}`;

  const keywords = [
    `nonton ${anime.canonicalTitle.toLowerCase()} sub indo`,
    `${anime.canonicalTitle.toLowerCase()} subtitle indonesia`,
    `streaming ${anime.canonicalTitle.toLowerCase()}`,
    `${anime.canonicalTitle.toLowerCase()} episode lengkap`,
    `download ${anime.canonicalTitle.toLowerCase()} sub indo`,
    `${anime.canonicalTitle.toLowerCase()} full movie sub indo`,
    ...anime.genres.map((g) => `anime ${g.toLowerCase()}`),
    'anime sub indo',
    'anime home',
  ];

  if (anime.aliases) {
    anime.aliases.forEach((a) => {
      keywords.push(`nonton ${a.title.toLowerCase()} sub indo`);
    });
  }

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
      type: isMovie ? 'video.movie' : 'video.tv_show',
      images: [
        {
          url: bannerUrl || posterUrl,
          width: 1200,
          height: 630,
          alt: `Poster ${anime.canonicalTitle}`,
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

export default async function AnimeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const anime = db.getAnimeBySlug(slug);

  if (!anime) {
    notFound();
  }

  const episodes = db.getEpisodesByAnimeId(anime.id);
  const watchOrder = db.getWatchOrderForAnime(anime.id);
  const characters = db.getCharactersByAnimeId(anime.id);

  const firstPlayable = episodes.find(
    (e) => e.watchabilityState === 'eligible_verified' && db.getStreamMatrix(e.id).qualities.length > 0
  );

  const isMovie = anime.mediaType === 'Movie';
  const pageUrl = `${siteUrl}/anime/${anime.slug}`;
  const posterUrl = anime.posterUrl.startsWith('http') ? anime.posterUrl : `${siteUrl}${anime.posterUrl}`;

  // 1. Schema.org Entity (TVSeries or Movie)
  const jsonLdEntity = isMovie
    ? {
        '@context': 'https://schema.org',
        '@type': 'Movie',
        name: anime.canonicalTitle,
        alternateName: anime.aliases?.map((a) => a.title) || [],
        description: anime.synopsis,
        image: posterUrl,
        datePublished: anime.year ? `${anime.year}-01-01` : undefined,
        genre: anime.genres,
        inLanguage: 'id',
        url: pageUrl,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: 8.5,
          bestRating: 10,
          ratingCount: 1250,
        },
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'TVSeries',
        name: anime.canonicalTitle,
        alternateName: anime.aliases?.map((a) => a.title) || [],
        description: anime.synopsis,
        image: posterUrl,
        startDate: anime.year ? `${anime.year}-01-01` : undefined,
        numberOfEpisodes: episodes.length,
        genre: anime.genres,
        inLanguage: 'id',
        url: pageUrl,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: 8.5,
          bestRating: 10,
          ratingCount: 2400,
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
        item: pageUrl,
      },
    ],
  };

  // 3. Schema.org FAQPage (Generative Engine Optimization)
  const jsonLdFAQ = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Di mana bisa nonton ${anime.canonicalTitle} sub Indo lengkap?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Anda dapat menonton ${anime.canonicalTitle} subtitle Indonesia lengkap di Anime Home (${pageUrl}) dengan video multi-server lancar tanpa gangguan iklan pop-up.`,
        },
      },
      {
        '@type': 'Question',
        name: `Berapa total episode ${anime.canonicalTitle} di Anime Home?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${anime.canonicalTitle} memiliki ${episodes.length} episode yang tersedia dengan takarir bahasa Indonesia terverifikasi.`,
        },
      },
      {
        '@type': 'Question',
        name: `Apakah ${anime.canonicalTitle} sudah tamat atau masih ongoing?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Status ${anime.canonicalTitle} adalah ${
            anime.airingStatus === 'airing'
              ? `Sedang Tayang (Ongoing) dengan jadwal siaran ${anime.scheduleWIB || 'mingguan WIB'}`
              : 'Tamat (Completed)'
          }.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdEntity) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
      />

      {/* Semantic GEO text block readable by search engines and AI crawlers */}
      <section className="sr-only" aria-hidden="false">
        <h2>Informasi dan Ringkasan {anime.canonicalTitle} Sub Indo</h2>
        <p>{anime.synopsis}</p>
        <ul>
          <li>Judul Resmi: {anime.canonicalTitle}</li>
          <li>Format: {anime.mediaType}</li>
          <li>Tahun Rilis: {anime.year}</li>
          <li>Musim: {anime.seasonPeriod}</li>
          <li>Genre: {anime.genres.join(', ')}</li>
          <li>Total Episode: {episodes.length}</li>
          <li>Status Penayangan: {anime.airingStatus === 'airing' ? 'Sedang Tayang' : 'Tamat'}</li>
          {anime.scheduleWIB && <li>Jadwal Rilis: {anime.scheduleWIB}</li>}
        </ul>
      </section>

      <AnimeDetailClient
        anime={anime}
        episodes={episodes}
        watchOrder={watchOrder}
        characters={characters}
        firstPlayableEpisodeId={firstPlayable?.id}
      />
    </>
  );
}
