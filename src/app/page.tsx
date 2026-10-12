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

  return <HomeClient initialAnime={allAnime} initialEpisodes={allEpisodes} />;
}
