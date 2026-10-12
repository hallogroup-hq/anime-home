import { NextResponse } from 'next/server';
import { db } from '@/lib/services/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Synchronize in-memory store with Turso Database Cloud
    await db.syncWithTurso(force);

    const anime = db.getAnimeList();
    const seasons = db.getAllSeasons();

    return NextResponse.json(
      {
        success: true,
        anime,
        seasons,
        totalAnime: anime.length,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    console.error('[/api/anime] Failed to fetch data from Turso:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        // Fallback to memory store if Turso is down
        anime: db.getAnimeList(),
      },
      { status: 500 }
    );
  }
}
