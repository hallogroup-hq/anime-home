import { dbOrm, schema } from '@/lib/db';
import { eq, asc, desc, and } from 'drizzle-orm';
import { Episode, AiringState, SubtitleState, WatchabilityState, PublishState } from '@/types';

function mapRowToEpisode(row: typeof schema.episodes.$inferSelect): Episode {
  return {
    id: row.id,
    animeId: row.animeId,
    ordinal: row.ordinal,
    displayNumber: row.displayNumber,
    episodeType: row.episodeType as any,
    title: row.title || `Episode ${row.displayNumber}`,
    durationMinutes: row.durationMinutes || 24,
    publishState: row.publishState as PublishState,
    airedAt: row.airedAt?.toISOString(),
    airingState: row.airingState as AiringState,
    subtitleState: row.subtitleState as SubtitleState,
    watchabilityState: row.watchabilityState as WatchabilityState,
  };
}

export class EpisodeRepository {
  public static async getEpisodesByAnimeId(animeId: string): Promise<Episode[]> {
    if (!dbOrm) return [];

    const rows = await dbOrm.select()
      .from(schema.episodes)
      .where(and(
        eq(schema.episodes.animeId, animeId),
        eq(schema.episodes.publishState, 'published')
      ))
      .orderBy(asc(schema.episodes.ordinal));

    return rows.map(mapRowToEpisode);
  }

  public static async getAllEpisodesByAnimeId(animeId: string): Promise<Episode[]> {
    if (!dbOrm) return [];

    const rows = await dbOrm.select()
      .from(schema.episodes)
      .where(eq(schema.episodes.animeId, animeId))
      .orderBy(asc(schema.episodes.ordinal));

    return rows.map(mapRowToEpisode);
  }

  public static async getEpisodeById(id: string): Promise<Episode | null> {
    if (!dbOrm) return null;

    const row = await dbOrm.query.episodes.findFirst({
      where: eq(schema.episodes.id, id),
    });

    if (!row) return null;
    return mapRowToEpisode(row);
  }

  public static async createEpisode(data: Partial<Episode>): Promise<Episode> {
    if (!dbOrm) throw new Error('Database not connected');

    const id = data.id || `ep-${data.animeId}-${data.ordinal || Date.now()}`;
    const ordinal = data.ordinal || 1;
    const displayNumber = data.displayNumber || (ordinal < 10 ? `0${ordinal}` : `${ordinal}`);
    const now = new Date();

    const insertValues = {
      id,
      animeId: data.animeId!,
      ordinal,
      displayNumber,
      episodeType: data.episodeType || 'standard',
      title: data.title || `Episode ${displayNumber}`,
      durationMinutes: data.durationMinutes || 24,
      publishState: data.publishState || 'published',
      airingState: data.airingState || 'aired',
      subtitleState: data.subtitleState || 'available',
      watchabilityState: data.watchabilityState || 'eligible_verified',
      airedAt: data.airedAt ? new Date(data.airedAt) : now,
      createdAt: now,
      updatedAt: now,
    };

    await dbOrm.insert(schema.episodes).values(insertValues).onConflictDoUpdate({
      target: schema.episodes.id,
      set: {
        title: insertValues.title,
        durationMinutes: insertValues.durationMinutes,
        publishState: insertValues.publishState,
        airingState: insertValues.airingState,
        subtitleState: insertValues.subtitleState,
        watchabilityState: insertValues.watchabilityState,
        updatedAt: now,
      }
    });

    const created = await this.getEpisodeById(id);
    if (!created) throw new Error(`Failed to retrieve episode ${id}`);
    return created;
  }

  public static async batchCreateEpisodes(animeId: string, count: number, startOrdinal?: number): Promise<Episode[]> {
    if (!dbOrm) throw new Error('Database not connected');

    // Find the current highest ordinal for this anime
    const existing = await dbOrm.select({ ordinal: schema.episodes.ordinal })
      .from(schema.episodes)
      .where(eq(schema.episodes.animeId, animeId))
      .orderBy(desc(schema.episodes.ordinal))
      .limit(1);

    const baseOrdinal = startOrdinal !== undefined ? startOrdinal : (existing[0]?.ordinal ? existing[0].ordinal + 1 : 1);
    const createdEpisodes: Episode[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const ord = baseOrdinal + i;
      const disp = ord < 10 ? `0${ord}` : `${ord}`;
      const epId = `ep-${animeId}-${disp}`;

      const insertValues = {
        id: epId,
        animeId,
        ordinal: ord,
        displayNumber: disp,
        episodeType: 'standard',
        title: `Episode ${disp}`,
        durationMinutes: 24,
        publishState: 'published',
        airingState: 'scheduled',
        subtitleState: 'pending',
        watchabilityState: 'unavailable',
        airedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      await dbOrm.insert(schema.episodes).values(insertValues).onConflictDoNothing();

      const ep = await this.getEpisodeById(epId);
      if (ep) createdEpisodes.push(ep);
    }

    return createdEpisodes;
  }

  public static async updateEpisode(id: string, updates: Partial<Episode>): Promise<Episode | null> {
    if (!dbOrm) return null;

    const setValues: any = {
      updatedAt: new Date(),
    };

    if (updates.title !== undefined) setValues.title = updates.title;
    if (updates.publishState !== undefined) setValues.publishState = updates.publishState;
    if (updates.airingState !== undefined) setValues.airingState = updates.airingState;
    if (updates.subtitleState !== undefined) setValues.subtitleState = updates.subtitleState;
    if (updates.watchabilityState !== undefined) setValues.watchabilityState = updates.watchabilityState;
    if (updates.durationMinutes !== undefined) setValues.durationMinutes = updates.durationMinutes;

    await dbOrm.update(schema.episodes)
      .set(setValues)
      .where(eq(schema.episodes.id, id));

    return this.getEpisodeById(id);
  }
}
