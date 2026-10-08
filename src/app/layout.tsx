import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'ANIME HOME — Streaming Discovery & Tracking Anime Indonesia',
  description: 'Temukan, ikuti, dan tonton anime favoritmu dengan ketersediaan multi-provider per resolusi, info subtitle Indonesia terverifikasi, dan pelacakan tontonan bebas hambatan.',
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
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-[#090A0F] text-zinc-100 flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-6">
          {children}
        </main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
