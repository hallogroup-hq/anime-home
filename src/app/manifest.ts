import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ANIME HOME — Anime Streaming Discovery Indonesia',
    short_name: 'AnimeHome',
    description: 'Platform streaming discovery, tracking, dan katalog multi-provider anime subtitle Indonesia.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090A0F',
    theme_color: '#090A0F',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
