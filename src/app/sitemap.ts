import { MetadataRoute } from 'next';
import { db } from '@/lib/services/store';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anime-home-psi.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const animeList = db.getAnimeList();
  const allEpisodes = db.getAllEpisodes();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/anime`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${siteUrl}/schedule`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
  ];

  const animeRoutes: MetadataRoute.Sitemap = animeList.map((a) => {
    const isOngoing = a.airingStatus === 'airing';
    const eps = db.getEpisodesByAnimeId(a.id);
    const latestEp = eps[eps.length - 1];
    const lastModified = latestEp?.airedAt ? new Date(latestEp.airedAt) : new Date();

    return {
      url: `${siteUrl}/anime/${a.slug}`,
      lastModified,
      changeFrequency: isOngoing ? 'daily' : 'weekly',
      priority: isOngoing ? 0.95 : 0.85,
    };
  });

  // Include verified playable episodes in the sitemap for direct episode search indexing
  const playableEpisodes = allEpisodes.filter((e) => e.watchabilityState === 'eligible_verified');
  const episodeRoutes: MetadataRoute.Sitemap = playableEpisodes.map((e) => ({
    url: `${siteUrl}/watch/${e.id}`,
    lastModified: e.airedAt ? new Date(e.airedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  return [...staticRoutes, ...animeRoutes, ...episodeRoutes];
}
