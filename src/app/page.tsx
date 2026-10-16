export const dynamic = 'force-dynamic';

import { db } from '@/lib/services/store';
import { HomeClient } from '@/components/home/HomeClient';

export default async function HomePage() {
  // Sync directly with Turso Cloud Database on server render
  try {
    await db.syncWithTurso();
  } catch (err: any) {
    console.warn('[HomePage] Turso sync fallback:', err.message);
  }

  const allAnime = db.getAnimeList();
  const allEpisodes = db.getAllEpisodes();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anime-home-psi.vercel.app';

  const jsonLdItemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Daftar Streaming Anime Sub Indo Terpopuler',
    description: 'Koleksi serial anime ongoing dan completed subtitle Indonesia terbaru di Anime Home.',
    itemListElement: allAnime.slice(0, 30).map((anime, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${siteUrl}/anime/${anime.slug}`,
      name: anime.canonicalTitle,
      image: anime.posterUrl.startsWith('http') ? anime.posterUrl : `${siteUrl}${anime.posterUrl}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdItemList) }}
      />

      {/* Semantic GEO & SEO text block for search engines and AI crawlers */}
      <section className="sr-only" aria-hidden="false">
        <h1>Anime Home — Streaming Anime Sub Indo Lengkap & Nonton Anime Online</h1>
        <h2>Situs Nonton Streaming Anime Subtitle Indonesia Terupdate</h2>
        <p>
          Anime Home adalah platform streaming anime subtitle Indonesia gratis, tercepat, dan terlengkap. 
          Nonton anime ongoing mingguan sesuai jadwal rilis WIB, anime completed, movie anime, dan koleksi lengkap 
          Detective Conan episode 1 sampai tamat dalam resolusi HD multi-server lancar tanpa lag.
        </p>
        <nav aria-label="Daftar Anime Terpopuler Sub Indo">
          <ul>
            {allAnime.slice(0, 25).map((a) => (
              <li key={a.id}>
                <a href={`/anime/${a.slug}`}>Nonton {a.canonicalTitle} Sub Indo</a>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <HomeClient initialAnime={allAnime} initialEpisodes={allEpisodes} />
    </>
  );
}
