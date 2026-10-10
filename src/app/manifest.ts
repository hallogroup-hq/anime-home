import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Anime Home — Streaming Anime Sub Indo',
    short_name: 'Anime Home',
    description: 'Platform streaming anime subtitle Indonesia multi-server terlengkap dan jadwal rilis WIB.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090A0F',
    theme_color: '#090A0F',
    icons: [
      {
        src: '/brand/logo-square.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/brand/logo-square.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
