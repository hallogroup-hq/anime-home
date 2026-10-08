import { MetadataRoute } from 'next';
import { db } from '@/lib/services/store';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://animehome.id';
  const animeList = db.getAnimeList();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/anime`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/schedule`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  const animeRoutes: MetadataRoute.Sitemap = animeList.map((a) => ({
    url: `${baseUrl}/anime/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticRoutes, ...animeRoutes];
}
