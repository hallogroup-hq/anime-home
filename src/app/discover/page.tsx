import { Metadata } from 'next';
import { db } from '@/lib/services/store';
import { DiscoverClient } from '@/components/merch/DiscoverClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anime-home-psi.vercel.app';

export const metadata: Metadata = {
  title: 'Anime Home Store — Merchandise Anime Resmi & Streetwear Sub Indo',
  description: 'Beli merchandise anime resmi dan berkualitas di Anime Home Store. Kaos streetwear DTF premium, hoodie, Nendoroid Good Smile, dan action figure original Conan, Frieren, Gojo, Tanjiro, Jin-Woo. Pembayaran instan QRIS.',
  keywords: [
    'merchandise anime resmi',
    'kaos anime streetwear',
    'kaos detektif conan',
    'nendoroid conan good smile',
    'figure frieren',
    'kaos gojo satoru',
    'hoodie conan aptx 4869',
    'toko merchandise anime indonesia',
    'anime home store',
  ],
  alternates: {
    canonical: `${siteUrl}/discover`,
  },
  openGraph: {
    title: 'Anime Home Store — Merchandise Anime Resmi & Streetwear Sub Indo',
    description: 'Koleksi kaos oversized, hoodie, action figure, dan pernak-pernik resmi Anime Home Store. Pembayaran QRIS instan.',
    url: `${siteUrl}/discover`,
    siteName: 'Anime Home',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/banners/anime-home-promo-banner.png',
        width: 1200,
        height: 630,
        alt: 'Anime Home Store Official Merchandise',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anime Home Store — Merchandise Anime Resmi',
    description: 'Kaos anime streetwear, hoodie, Nendoroid & action figure original. Belanja aman dengan QRIS instan.',
    images: ['/banners/anime-home-promo-banner.png'],
    creator: '@AnimeHomeID',
  },
};

export default function DiscoverPage() {
  const merchItems = db.getAllMerch();

  // 1. Schema.org CollectionPage & ItemList with Products
  const jsonLdStore = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Anime Home Store',
    description: 'Etalase merchandise anime resmi Anime Home dengan produk apparel, action figure, dan aksesoris berlisensi.',
    url: `${siteUrl}/discover`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: merchItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: item.name,
          description: `Merchandise resmi ${item.animeTitle} dari ${item.storeName}`,
          image: item.imageUrl.startsWith('http') ? item.imageUrl : `${siteUrl}${item.imageUrl}`,
          category: item.category,
          offers: {
            '@type': 'Offer',
            price: item.price,
            priceCurrency: 'IDR',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: 'Anime Home Store',
            },
          },
        },
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
        name: 'Anime Home Store',
        item: `${siteUrl}/discover`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdStore) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      {/* Semantic GEO text block for AI search bots */}
      <section className="sr-only" aria-hidden="false">
        <h2>Daftar Merchandise Anime Home Store</h2>
        <ul>
          {merchItems.map((m) => (
            <li key={m.id}>
              {m.name} — Serial: {m.animeTitle} — Kategori: {m.category} — Harga: Rp {m.price.toLocaleString('id-ID')}
            </li>
          ))}
        </ul>
      </section>

      <DiscoverClient initialMerch={merchItems} />
    </>
  );
}
