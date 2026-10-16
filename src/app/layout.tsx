import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { LiveSupportWidget } from '@/components/chat/LiveSupportWidget';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anime-home-psi.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ANIME HOME — Streaming Anime Sub Indo Lengkap & Nonton Anime Online',
    template: '%s — Anime Home',
  },
  description: 'Nonton streaming anime subtitle Indonesia terlengkap dan terupdate. Ribuan episode anime ongoing & completed, Detective Conan Season 1-30 & 28 Movie, Frieren, Jujutsu Kaisen, Solo Leveling, jadwal rilis WIB, dan multi-server lancar tanpa kendala.',
  keywords: [
    'streaming anime',
    'streaming anime sub indo',
    'nonton anime sub indo',
    'nonton anime online',
    'streaming anime subtitle indonesia',
    'situs nonton anime gratis',
    'anime sub indo lengkap',
    'download anime sub indo',
    'animeindo',
    'samehadaku',
    'otakudesu',
    'anoboy',
    'kuramanime',
    'detective conan sub indo',
    'nonton conan movie 1-28 sub indo',
    'jadwal rilis anime wib',
    'anime ongoing sub indo',
    'anime completed sub indo',
    'urutan nonton anime',
    'anime home',
    'anime home store',
    'merchandise anime indonesia',
  ],
  authors: [{ name: 'Anime Home Team' }],
  creator: 'Anime Home',
  publisher: 'Anime Home',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/brand/logo-square.png',
    apple: '/brand/logo-square.png',
  },
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ANIME HOME — Streaming Anime Sub Indo Lengkap & Nonton Anime Online',
    description: 'Nonton anime sub Indo multi-server tanpa ribet. Koleksi Detective Conan lengkap episode 1 sampai terbaru, 28 movie canonical, dan update anime ongoing tiap hari.',
    url: siteUrl,
    siteName: 'Anime Home',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/banners/anime-home-promo-banner.png',
        width: 1200,
        height: 630,
        alt: 'Anime Home — Streaming Anime Subtitle Indonesia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ANIME HOME — Streaming Anime Sub Indo Lengkap & Nonton Anime Online',
    description: 'Streaming anime sub Indo multi-server lancar. Detective Conan lengkap S1-S30 & 28 Movie, Frieren, Jujutsu Kaisen, dan jadwal rilis WIB.',
    images: ['/banners/anime-home-promo-banner.png'],
    creator: '@AnimeHomeID',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.YANDEX_VERIFICATION || undefined,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#090A0F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLdWebSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Anime Home',
    alternateName: ['AnimeHome', 'Anime Home Indonesia', 'AnimeHome.id', 'Streaming Anime Sub Indo', 'Nonton Anime Sub Indo'],
    url: siteUrl,
    description: 'Platform streaming dan nonton anime subtitle Indonesia terlengkap dengan multi-server video player, takarir terverifikasi, jadwal rilis WIB, dan merchandise resmi.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/anime?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'id-ID',
  };

  const jsonLdOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Anime Home',
    url: siteUrl,
    logo: `${siteUrl}/brand/logo-square.png`,
    description: 'Pusat streaming anime subtitle Indonesia dan merchandise anime white-label resmi.',
    sameAs: [
      'https://twitter.com/AnimeHomeID',
    ],
  };

  return (
    <html lang="id" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
      </head>
      <body className="min-h-screen bg-[#090A0F] text-zinc-100 flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-6">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <LiveSupportWidget />
      </body>
    </html>
  );
}
