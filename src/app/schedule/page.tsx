import { Metadata } from 'next';
import { db } from '@/lib/services/store';
import { ScheduleClient } from '@/components/schedule/ScheduleClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anime-home-psi.vercel.app';

export const metadata: Metadata = {
  title: 'Jadwal Rilis Anime Ongoing Sub Indo Lengkap (WIB)',
  description: 'Jadwal tayang anime on-going mingguan terlengkap dalam zona Waktu Indonesia Barat (WIB). Ketahui jam rilis Detective Conan S30, Blue Lock, Dandadan, Bleach, dan One Piece sub Indo.',
  keywords: [
    'jadwal rilis anime wib',
    'jadwal tayang anime sub indo',
    'jadwal anime ongoing',
    'jam rilis anime samehadaku otakudesu',
    'jadwal anime conan season 30',
    'jadwal rilis one piece wib',
    'anime home schedule',
  ],
  alternates: {
    canonical: `${siteUrl}/schedule`,
  },
  openGraph: {
    title: 'Jadwal Rilis Anime Ongoing Sub Indo (WIB) — Anime Home',
    description: 'Pantau jam tayang anime ongoing mingguan zona Waktu Indonesia Barat (WIB). Terupdate otomatis.',
    url: `${siteUrl}/schedule`,
    siteName: 'Anime Home',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/banners/anime-home-promo-banner.png',
        width: 1200,
        height: 630,
        alt: 'Jadwal Rilis Anime Sub Indo Anime Home',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jadwal Rilis Anime Sub Indo Lengkap (WIB)',
    description: 'Update jadwal rilis anime ongoing setiap hari Senin sampai Minggu dalam waktu WIB.',
    images: ['/banners/anime-home-promo-banner.png'],
    creator: '@AnimeHomeID',
  },
};

export default function SchedulePage() {
  const allAnime = db.getAnimeList();

  const DAY_ORDER: Record<string, number> = {
    'Senin': 1,
    'Selasa': 2,
    'Rabu': 3,
    'Kamis': 4,
    'Jumat': 5,
    'Sabtu': 6,
    'Minggu': 7,
  };

  const ongoingAnime = allAnime
    .filter((a) => a.airingStatus === 'airing' || Boolean(a.scheduleWIB))
    .sort((a, b) => {
      const dayA = a.scheduleWIB?.split(',')[0]?.trim() || '';
      const dayB = b.scheduleWIB?.split(',')[0]?.trim() || '';
      const weightA = DAY_ORDER[dayA] || 99;
      const weightB = DAY_ORDER[dayB] || 99;
      return weightA - weightB;
    })
    .map((anime) => {
      const eps = db.getEpisodesByAnimeId(anime.id);
      const latestEpisode = eps.length > 0 ? eps[eps.length - 1] : null;
      return { anime, latestEpisode };
    });

  // 1. Schema.org BreadcrumbList
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
        name: 'Jadwal Rilis Anime',
        item: `${siteUrl}/schedule`,
      },
    ],
  };

  // 2. Schema.org BroadcastEvent Schedule
  const jsonLdSchedule = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Jadwal Rilis Anime Ongoing Sub Indo (WIB)',
    description: 'Daftar serial anime on-going yang tayang mingguan di Anime Home zona Waktu Indonesia Barat.',
    itemListElement: ongoingAnime.map(({ anime }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${anime.canonicalTitle} (${anime.scheduleWIB || 'Mingguan WIB'})`,
      url: `${siteUrl}/anime/${anime.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchedule) }}
      />

      {/* Semantic GEO text table for search crawlers */}
      <section className="sr-only" aria-hidden="false">
        <h2>Tabel Jadwal Rilis Anime Ongoing Sub Indo (WIB)</h2>
        <table>
          <thead>
            <tr>
              <th>Judul Anime</th>
              <th>Jadwal Siaran WIB</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ongoingAnime.map(({ anime }) => (
              <tr key={anime.id}>
                <td>{anime.canonicalTitle}</td>
                <td>{anime.scheduleWIB || 'TBA'}</td>
                <td>{anime.airingStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ScheduleClient ongoingAnime={ongoingAnime} />
    </>
  );
}
