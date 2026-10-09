import { dbOrm, schema } from '@/lib/db';
import { eq, desc, asc, ilike, and, or, inArray } from 'drizzle-orm';
import { Anime, AnimeTitle, MediaType } from '@/types';

function mapRowToAnime(row: typeof schema.anime.$inferSelect, titles?: (typeof schema.animeTitles.$inferSelect)[]): Anime {
  let parsedGenres: string[] = [];
  try {
    parsedGenres = typeof row.genres === 'string' ? JSON.parse(row.genres) : (row.genres || []);
  } catch {
    parsedGenres = [];
  }

  return {
    id: row.id,
    canonicalTitle: row.canonicalTitle,
    slug: row.slug,
    mediaType: row.mediaType as MediaType,
    synopsis: row.synopsis || '',
    firstAirDate: row.firstAirDate || '',
    year: row.year || 0,
    seasonPeriod: (row.seasonPeriod as any) || 'Winter',
    maturityRating: row.maturityRating || 'PG-13',
    airingStatus: row.airingStatus as any,
    publishState: row.publishState as any,
    posterUrl: row.posterUrl || '',
    bannerUrl: row.bannerUrl || '',
    genres: parsedGenres,
    aliases: titles ? titles.map(t => ({
      id: t.id,
      animeId: t.animeId,
      locale: t.locale,
      title: t.title,
      titleType: t.titleType as any,
      normalizedTitle: t.normalizedTitle,
    })) : undefined,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
  };
}

export class AnimeRepository {
  public static async getAnimeList(params?: {
    query?: string;
    genre?: string;
    status?: string;
    year?: number;
    seasonPeriod?: string;
    mediaType?: MediaType;
    sortBy?: 'popular' | 'latest' | 'score' | 'title_asc';
  }): Promise<Anime[]> {
    if (!dbOrm) return [];

    let matchingAnimeIds: string[] | null = null;

    // Search query matches both canonical title and multi-locale aliases
    if (params?.query && params.query.trim().length > 0) {
      const q = params.query.trim().toLowerCase();
      
      // Match in anime table
      const canonicalMatches = await dbOrm.select({ id: schema.anime.id })
        .from(schema.anime)
        .where(ilike(schema.anime.canonicalTitle, `%${q}%`));

      // Match in anime_titles (Romaji, Japanese Kanji, English, Indonesian)
      const aliasMatches = await dbOrm.select({ animeId: schema.animeTitles.animeId })
        .from(schema.animeTitles)
        .where(
          or(
            ilike(schema.animeTitles.title, `%${q}%`),
            ilike(schema.animeTitles.normalizedTitle, `%${q}%`)
          )
        );

      const idSet = new Set<string>([
        ...canonicalMatches.map(m => m.id),
        ...aliasMatches.map(m => m.animeId)
      ]);

      if (idSet.size === 0) {
        return [];
      }
      matchingAnimeIds = Array.from(idSet);
    }

    const conditions = [];

    // Default published filter unless specified
    conditions.push(eq(schema.anime.publishState, 'published'));

    if (matchingAnimeIds !== null) {
      conditions.push(inArray(schema.anime.id, matchingAnimeIds));
    }

    if (params?.status && params.status !== 'Semua') {
      conditions.push(eq(schema.anime.airingStatus, params.status));
    }

    if (params?.year) {
      conditions.push(eq(schema.anime.year, Number(params.year)));
    }

    if (params?.seasonPeriod && params.seasonPeriod !== 'Semua') {
      conditions.push(eq(schema.anime.seasonPeriod, params.seasonPeriod));
    }

    if (params?.mediaType) {
      conditions.push(eq(schema.anime.mediaType, params.mediaType));
    }

    // Determine sorting
    let orderByClause = desc(schema.anime.createdAt);
    if (params?.sortBy === 'latest') {
      orderByClause = desc(schema.anime.firstAirDate);
    } else if (params?.sortBy === 'title_asc') {
      orderByClause = asc(schema.anime.canonicalTitle);
    }

    const rows = await dbOrm.query.anime.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: orderByClause,
      with: {
        titles: true,
      },
    });

    let result = rows.map(r => mapRowToAnime(r, r.titles));

    // Post-filter by genre (stored as JSON)
    if (params?.genre && params.genre !== 'Semua') {
      result = result.filter(a => a.genres.includes(params.genre!));
    }

    return result;
  }

  public static async getAnimeBySlug(slug: string): Promise<Anime | null> {
    if (!dbOrm) return null;

    const row = await dbOrm.query.anime.findFirst({
      where: eq(schema.anime.slug, slug),
      with: {
        titles: true,
      },
    });

    if (!row) return null;
    return mapRowToAnime(row, row.titles);
  }

  public static async getAnimeById(id: string): Promise<Anime | null> {
    if (!dbOrm) return null;

    const row = await dbOrm.query.anime.findFirst({
      where: eq(schema.anime.id, id),
      with: {
        titles: true,
      },
    });

    if (!row) return null;
    return mapRowToAnime(row, row.titles);
  }

  public static async createAnime(animeData: Partial<Anime>, titles?: AnimeTitle[]): Promise<Anime> {
    if (!dbOrm) throw new Error('Database not connected');

    const id = animeData.id || `anime-${Date.now()}`;
    const slug = animeData.slug || animeData.canonicalTitle?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `anime-${Date.now()}`;
    const now = new Date();

    let finalSlug = slug;
    const existingSlug = await dbOrm.query.anime.findFirst({
      where: eq(schema.anime.slug, finalSlug),
    });
    if (existingSlug && existingSlug.id !== id) {
      finalSlug = `${slug}-${Date.now().toString(36)}`;
    }

    const insertValues = {
      id,
      canonicalTitle: animeData.canonicalTitle || 'Untitled Anime',
      slug: finalSlug,
      mediaType: animeData.mediaType || 'TV',
      synopsis: animeData.synopsis || '',
      firstAirDate: animeData.firstAirDate || null,
      year: animeData.year || now.getFullYear(),
      seasonPeriod: animeData.seasonPeriod || 'Winter',
      maturityRating: animeData.maturityRating || 'PG-13',
      airingStatus: animeData.airingStatus || 'airing',
      publishState: animeData.publishState || 'published',
      posterUrl: animeData.posterUrl || '',
      bannerUrl: animeData.bannerUrl || '',
      genres: JSON.stringify(animeData.genres || []),
      createdAt: now,
      updatedAt: now,
    };

    await dbOrm.insert(schema.anime).values(insertValues).onConflictDoUpdate({
      target: schema.anime.id,
      set: {
        canonicalTitle: insertValues.canonicalTitle,
        synopsis: insertValues.synopsis,
        year: insertValues.year,
        seasonPeriod: insertValues.seasonPeriod,
        airingStatus: insertValues.airingStatus,
        publishState: insertValues.publishState,
        posterUrl: insertValues.posterUrl,
        bannerUrl: insertValues.bannerUrl,
        genres: insertValues.genres,
        updatedAt: now,
      }
    });

    if (titles && titles.length > 0) {
      for (const t of titles) {
        await dbOrm.insert(schema.animeTitles).values({
          id: t.id || `title-${id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          animeId: id,
          locale: t.locale || 'ja-Latn',
          title: t.title,
          titleType: t.titleType || 'alias',
          normalizedTitle: t.normalizedTitle || t.title.toLowerCase().trim(),
        }).onConflictDoNothing();
      }
    }

    const created = await this.getAnimeById(id);
    if (!created) throw new Error(`Failed to retrieve newly created anime ${id}`);
    return created;
  }

  public static async updateAnime(id: string, updates: Partial<Anime>): Promise<Anime | null> {
    if (!dbOrm) return null;

    const setValues: any = {
      updatedAt: new Date(),
    };

    if (updates.canonicalTitle !== undefined) setValues.canonicalTitle = updates.canonicalTitle;
    if (updates.synopsis !== undefined) setValues.synopsis = updates.synopsis;
    if (updates.mediaType !== undefined) setValues.mediaType = updates.mediaType;
    if (updates.airingStatus !== undefined) setValues.airingStatus = updates.airingStatus;
    if (updates.publishState !== undefined) setValues.publishState = updates.publishState;
    if (updates.year !== undefined) setValues.year = updates.year;
    if (updates.seasonPeriod !== undefined) setValues.seasonPeriod = updates.seasonPeriod;
    if (updates.maturityRating !== undefined) setValues.maturityRating = updates.maturityRating;
    if (updates.posterUrl !== undefined) setValues.posterUrl = updates.posterUrl;
    if (updates.bannerUrl !== undefined) setValues.bannerUrl = updates.bannerUrl;
    if (updates.genres !== undefined) setValues.genres = JSON.stringify(updates.genres);

    await dbOrm.update(schema.anime)
      .set(setValues)
      .where(eq(schema.anime.id, id));

    return this.getAnimeById(id);
  }

  public static async getAllAnimeForAdmin(): Promise<Anime[]> {
    if (!dbOrm) return [];

    const rows = await dbOrm.query.anime.findMany({
      orderBy: desc(schema.anime.createdAt),
      with: {
        titles: true,
      },
    });

    return rows.map(r => mapRowToAnime(r, r.titles));
  }

  public static async deleteAnime(id: string): Promise<boolean> {
    if (!dbOrm) return false;

    // Delete all episodes and their stream variants
    const eps = await dbOrm.select({ id: schema.episodes.id })
      .from(schema.episodes)
      .where(eq(schema.episodes.animeId, id));

    for (const ep of eps) {
      await dbOrm.delete(schema.streamVariants).where(eq(schema.streamVariants.episodeId, ep.id));
    }
    await dbOrm.delete(schema.episodes).where(eq(schema.episodes.animeId, id));
    await dbOrm.delete(schema.animeTitles).where(eq(schema.animeTitles.animeId, id));
    await dbOrm.delete(schema.anime).where(eq(schema.anime.id, id));

    return true;
  }
}
