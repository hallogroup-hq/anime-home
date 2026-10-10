import { Metadata } from 'next';
import { db } from '@/lib/services/store';
import { CatalogClient } from '@/components/catalog/CatalogClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anime-home-psi.vercel.app';

export const metadata: Metadata = {
  title: 'Katalog Anime Sub Indo Terlengkap — Genre, Musim, Status & Watch Order',
  description: 'Jelajahi seluruh koleksi anime subtitle Indonesia di Anime Home. Filter berdasarkan genre (Action, Adventure, Fantasy, Drama), format TV dan Movie, tahun rilis, dan status tayang.',
  keywords: [
    'katalog anime sub indo',
    'daftar anime lengkap',
    'nonton anime sub indo terlengkap',
    'anime action sub indo',
    'anime movie sub indo',
    'urutan nonton anime indonesia',
    'anime ongoing dan tamat',
    'anime home',
  ],
  alternates: {
    canonical: `${siteUrl}/anime`,
  },
  openGraph: {
    title: 'Katalog Anime Sub Indo Terlengkap — Anime Home',
    description: 'Koleksi ribuan episode anime subtitle Indonesia dengan multi-server video player dan filter lengkap.',
    url: `${siteUrl}/anime`,
    siteName: 'Anime Home',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/banners/anime-home-promo-banner.png',
        width: 1200,
        height: 630,
        alt: 'Katalog Anime Sub Indo Lengkap Anime Home',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Katalog Anime Sub Indo Terlengkap — Anime Home',
    description: 'Cari dan tonton anime favoritmu dengan kualitas hingga 1080p dan multi-server cadangan.',
    images: ['/banners/anime-home-promo-banner.png'],
    creator: '@AnimeHomeID',
  },
};

export default function AnimeCatalogPage() {
  const animeList = db.getAnimeList();

  // 1. Schema.org CollectionPage & ItemList
  const jsonLdCatalog = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Katalog Anime Subtitle Indonesia',
    description: 'Daftar serial dan film anime subtitle Indonesia terlengkap di Anime Home.',
    url: `${siteUrl}/anime`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: animeList.length,
      itemListElement: animeList.slice(0, 50).map((anime, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}/anime/${anime.slug}`,
        name: anime.canonicalTitle,
      })),
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
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCatalog) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      {/* Semantic GEO text block for AI and search bots */}
      <section className="sr-only" aria-hidden="false">
        <h2>Katalog Lengkap Serial dan Film Anime Sub Indo</h2>
        <p>
          Menampilkan total {animeList.length} judul anime terindeks dengan takarir bahasa Indonesia terverifikasi,
          multi-server cadangan, dan urutan kronologis penayangan.
        </p>
        <ul>
          {animeList.slice(0, 30).map((a) => (
            <li key={a.id}>
              {a.canonicalTitle} ({a.mediaType}, {a.year}) — {a.genres.join(', ')} — {a.airingStatus}
            </li>
          ))}
        </ul>
      </section>

      <CatalogClient />
    </>
  );
}
