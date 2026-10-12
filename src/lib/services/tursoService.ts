import { getTursoClient } from '@/lib/db/tursoClient';
import { Anime, Episode, Season, StreamVariant, MediaType, AiringStatus, PublishState, AiringState, SubtitleState, WatchabilityState, QualityLabel } from '@/types';

export class TursoService {
  /**
   * Mengambil semua anime published
   */
  public static async getAllAnime(): Promise<Anime[]> {
    const client = getTursoClient();
    if (!client) return [];

    const rs = await client.execute(`
      SELECT a.*, 
        (SELECT json_group_array(json_object(
          'id', t.id, 
          'animeId', t.anime_id, 
          'locale', t.locale, 
          'title', t.title, 
          'titleType', t.title_type, 
          'normalizedTitle', t.normalized_title
        )) FROM anime_titles t WHERE t.anime_id = a.id) as aliases_json
      FROM anime a
      WHERE a.publish_state = 'published'
      ORDER BY a.year DESC, a.created_at DESC;
    `);

    return rs.rows.map((r: any) => {
      let genres: string[] = [];
      try {
        genres = typeof r.genres === 'string' ? JSON.parse(r.genres) : (r.genres || []);
      } catch {
        genres = [];
      }

      let aliases: any[] = [];
      try {
        aliases = r.aliases_json ? JSON.parse(r.aliases_json) : [];
      } catch {
        aliases = [];
      }

      return {
        id: String(r.id),
        canonicalTitle: String(r.canonical_title),
        slug: String(r.slug),
        mediaType: r.media_type as MediaType,
        synopsis: String(r.synopsis || ''),
        firstAirDate: String(r.first_air_date || ''),
        year: Number(r.year || 0),
        seasonPeriod: r.season_period as any,
        maturityRating: String(r.maturity_rating || 'PG-13'),
        airingStatus: r.airing_status as AiringStatus,
        publishState: r.publish_state as PublishState,
        posterUrl: String(r.poster_url || ''),
        bannerUrl: String(r.banner_url || ''),
        genres,
        aliases,
        seasonReadinessState: r.season_readiness_state as any,
        totalCanonicalEpisodes: r.total_canonical_episodes ? Number(r.total_canonical_episodes) : undefined,
        scheduleWIB: r.schedule_wib ? String(r.schedule_wib) : undefined,
        officialPlatformName: r.official_platform_name ? String(r.official_platform_name) : undefined,
        externalFreeWatchUrl: r.external_free_watch_url ? String(r.external_free_watch_url) : undefined,
        createdAt: String(r.created_at || ''),
        updatedAt: String(r.updated_at || ''),
      };
    });
  }

  /**
   * Mengambil anime berdasarkan slug
   */
  public static async getAnimeBySlug(slug: string): Promise<Anime | null> {
    const client = getTursoClient();
    if (!client) return null;

    const rs = await client.execute({
      sql: `
        SELECT a.*,
          (SELECT json_group_array(json_object(
            'id', t.id, 
            'animeId', t.anime_id, 
            'locale', t.locale, 
            'title', t.title, 
            'titleType', t.title_type, 
            'normalizedTitle', t.normalized_title
          )) FROM anime_titles t WHERE t.anime_id = a.id) as aliases_json
        FROM anime a
        WHERE a.slug = ?
        LIMIT 1;
      `,
      args: [slug],
    });

    if (rs.rows.length === 0) return null;
    const r: any = rs.rows[0];

    let genres: string[] = [];
    try {
      genres = typeof r.genres === 'string' ? JSON.parse(r.genres) : (r.genres || []);
    } catch {
      genres = [];
    }

    let aliases: any[] = [];
    try {
      aliases = r.aliases_json ? JSON.parse(r.aliases_json) : [];
    } catch {
      aliases = [];
    }

    return {
      id: String(r.id),
      canonicalTitle: String(r.canonical_title),
      slug: String(r.slug),
      mediaType: r.media_type as MediaType,
      synopsis: String(r.synopsis || ''),
      firstAirDate: String(r.first_air_date || ''),
      year: Number(r.year || 0),
      seasonPeriod: r.season_period as any,
      maturityRating: String(r.maturity_rating || 'PG-13'),
      airingStatus: r.airing_status as AiringStatus,
      publishState: r.publish_state as PublishState,
      posterUrl: String(r.poster_url || ''),
      bannerUrl: String(r.banner_url || ''),
      genres,
      aliases,
      seasonReadinessState: r.season_readiness_state as any,
      totalCanonicalEpisodes: r.total_canonical_episodes ? Number(r.total_canonical_episodes) : undefined,
      scheduleWIB: r.schedule_wib ? String(r.schedule_wib) : undefined,
      officialPlatformName: r.official_platform_name ? String(r.official_platform_name) : undefined,
      externalFreeWatchUrl: r.external_free_watch_url ? String(r.external_free_watch_url) : undefined,
      createdAt: String(r.created_at || ''),
      updatedAt: String(r.updated_at || ''),
    };
  }

  /**
   * Mengambil episodes untuk suatu anime
   */
  public static async getEpisodesByAnimeId(animeId: string): Promise<Episode[]> {
    const client = getTursoClient();
    if (!client) return [];

    const rs = await client.execute({
      sql: `SELECT * FROM episodes WHERE anime_id = ? ORDER BY ordinal ASC;`,
      args: [animeId],
    });

    return rs.rows.map((r: any) => ({
      id: String(r.id),
      animeId: String(r.anime_id),
      seasonId: r.season_id ? String(r.season_id) : undefined,
      ordinal: Number(r.ordinal),
      displayNumber: String(r.display_number),
      episodeType: r.episode_type as any,
      title: String(r.title || `Episode ${r.display_number}`),
      durationMinutes: r.duration_minutes ? Number(r.duration_minutes) : undefined,
      publishState: r.publish_state as PublishState,
      airingState: r.airing_state as AiringState,
      subtitleState: r.subtitle_state as SubtitleState,
      watchabilityState: r.watchability_state as WatchabilityState,
      externalWatchUrl: r.external_watch_url ? String(r.external_watch_url) : undefined,
      externalPlatformName: r.external_platform_name ? String(r.external_platform_name) : undefined,
      airedAt: r.aired_at ? String(r.aired_at) : undefined,
    }));
  }

  /**
   * Mengambil episode berdasarkan ID
   */
  public static async getEpisodeById(episodeId: string): Promise<Episode | null> {
    const client = getTursoClient();
    if (!client) return null;

    const rs = await client.execute({
      sql: `SELECT * FROM episodes WHERE id = ? LIMIT 1;`,
      args: [episodeId],
    });

    if (rs.rows.length === 0) return null;
    const r: any = rs.rows[0];

    return {
      id: String(r.id),
      animeId: String(r.anime_id),
      seasonId: r.season_id ? String(r.season_id) : undefined,
      ordinal: Number(r.ordinal),
      displayNumber: String(r.display_number),
      episodeType: r.episode_type as any,
      title: String(r.title || `Episode ${r.display_number}`),
      durationMinutes: r.duration_minutes ? Number(r.duration_minutes) : undefined,
      publishState: r.publish_state as PublishState,
      airingState: r.airing_state as AiringState,
      subtitleState: r.subtitle_state as SubtitleState,
      watchabilityState: r.watchability_state as WatchabilityState,
      externalWatchUrl: r.external_watch_url ? String(r.external_watch_url) : undefined,
      externalPlatformName: r.external_platform_name ? String(r.external_platform_name) : undefined,
      airedAt: r.aired_at ? String(r.aired_at) : undefined,
    };
  }

  /**
   * Mengambil stream variants untuk suatu episode
   */
  public static async getVariantsByEpisodeId(episodeId: string): Promise<StreamVariant[]> {
    const client = getTursoClient();
    if (!client) return [];

    const rs = await client.execute({
      sql: `SELECT * FROM stream_variants WHERE episode_id = ? ORDER BY priority DESC;`,
      args: [episodeId],
    });

    return rs.rows.map((r: any) => ({
      id: String(r.id),
      episodeId: String(r.episode_id),
      providerId: String(r.provider_id),
      providerName: String(r.provider_name),
      qualityLabel: r.quality_label as QualityLabel,
      sourceRef: String(r.source_ref),
      embedUrl: String(r.embed_url),
      audioLocale: String(r.audio_locale || 'ja-JP'),
      subtitleLocale: String(r.subtitle_locale || 'id-ID'),
      priority: Number(r.priority || 0),
      verificationState: r.verification_state as any,
      moderationState: r.moderation_state as any,
      lastCheckedAt: String(r.last_checked_at || ''),
    }));
  }

  /**
   * Mengambil seluruh data anime untuk sync in-memory cache
   */
  public static async fetchFullSnapshot(): Promise<{
    anime: Anime[];
    episodes: Episode[];
    variants: StreamVariant[];
    seasons: Season[];
  }> {
    const client = getTursoClient();
    if (!client) {
      return { anime: [], episodes: [], variants: [], seasons: [] };
    }

    const [animeRes, epRes, varRes, seasonRes] = await Promise.all([
      this.getAllAnime(),
      client.execute('SELECT * FROM episodes ORDER BY ordinal ASC;'),
      client.execute('SELECT * FROM stream_variants ORDER BY priority DESC;'),
      client.execute('SELECT * FROM seasons;'),
    ]);

    const episodes: Episode[] = epRes.rows.map((r: any) => ({
      id: String(r.id),
      animeId: String(r.anime_id),
      seasonId: r.season_id ? String(r.season_id) : undefined,
      ordinal: Number(r.ordinal),
      displayNumber: String(r.display_number),
      episodeType: r.episode_type as any,
      title: String(r.title || `Episode ${r.display_number}`),
      durationMinutes: r.duration_minutes ? Number(r.duration_minutes) : undefined,
      publishState: r.publish_state as PublishState,
      airingState: r.airing_state as AiringState,
      subtitleState: r.subtitle_state as SubtitleState,
      watchabilityState: r.watchability_state as WatchabilityState,
      externalWatchUrl: r.external_watch_url ? String(r.external_watch_url) : undefined,
      externalPlatformName: r.external_platform_name ? String(r.external_platform_name) : undefined,
      airedAt: r.aired_at ? String(r.aired_at) : undefined,
    }));

    const variants: StreamVariant[] = varRes.rows.map((r: any) => ({
      id: String(r.id),
      episodeId: String(r.episode_id),
      providerId: String(r.provider_id),
      providerName: String(r.provider_name),
      qualityLabel: r.quality_label as QualityLabel,
      sourceRef: String(r.source_ref),
      embedUrl: String(r.embed_url),
      audioLocale: String(r.audio_locale || 'ja-JP'),
      subtitleLocale: String(r.subtitle_locale || 'id-ID'),
      priority: Number(r.priority || 0),
      verificationState: r.verification_state as any,
      moderationState: r.moderation_state as any,
      lastCheckedAt: String(r.last_checked_at || ''),
    }));

    const seasons: Season[] = seasonRes.rows.map((r: any) => {
      let missingEpisodes: number[] = [];
      try {
        missingEpisodes = r.missing_episodes ? JSON.parse(r.missing_episodes) : [];
      } catch {
        missingEpisodes = [];
      }

      return {
        id: String(r.id),
        animeId: String(r.anime_id),
        seasonNumber: Number(r.season_number || 1),
        title: String(r.title),
        year: Number(r.year || 0),
        seasonPeriod: r.season_period as any,
        canonicalEpisodesCount: Number(r.canonical_episodes_count || 0),
        airedEpisodesCount: Number(r.aired_episodes_count || 0),
        verifiedEpisodesCount: Number(r.verified_episodes_count || 0),
        missingEpisodes,
        readinessState: r.readiness_state as any,
        licenseType: r.license_type as any,
        externalFreeWatchUrl: r.external_free_watch_url ? String(r.external_free_watch_url) : undefined,
        officialPlatformName: r.official_platform_name ? String(r.official_platform_name) : undefined,
        notes: r.notes ? String(r.notes) : undefined,
        updatedAt: String(r.updated_at || ''),
      };
    });

    return {
      anime: animeRes,
      episodes,
      variants,
      seasons,
    };
  }

  /**
   * Simpan episode baru ke Turso Database secara live (tanpa butuh deploy)
   */
  public static async insertNewEpisodeWithVariants(
    episode: Episode,
    variants: StreamVariant[],
    anime?: Anime & { totalCanonicalEpisodes?: number }
  ): Promise<void> {
    const client = getTursoClient();
    if (!client) return;

    const statements: any[] = [];

    // 0. Ensure Anime and Aliases exist first to satisfy Foreign Key constraints
    if (anime) {
      statements.push({
        sql: `INSERT INTO anime (
          id, canonical_title, slug, media_type, synopsis, first_air_date, year,
          season_period, maturity_rating, airing_status, publish_state, poster_url,
          banner_url, genres, season_readiness_state, total_canonical_episodes,
          schedule_wib, official_platform_name, external_free_watch_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          canonical_title=excluded.canonical_title,
          slug=excluded.slug,
          synopsis=excluded.synopsis,
          airing_status=excluded.airing_status,
          poster_url=excluded.poster_url,
          banner_url=excluded.banner_url,
          genres=excluded.genres,
          total_canonical_episodes=excluded.total_canonical_episodes,
          schedule_wib=excluded.schedule_wib,
          updated_at=excluded.updated_at;`,
        args: [
          anime.id,
          anime.canonicalTitle,
          anime.slug,
          anime.mediaType || 'TV',
          anime.synopsis || null,
          anime.firstAirDate || null,
          anime.year || null,
          anime.seasonPeriod || null,
          anime.maturityRating || 'PG-13',
          anime.airingStatus || 'airing',
          anime.publishState || 'published',
          anime.posterUrl || null,
          anime.bannerUrl || null,
          JSON.stringify(anime.genres || []),
          anime.seasonReadinessState || null,
          anime.totalCanonicalEpisodes || null,
          anime.scheduleWIB || null,
          anime.officialPlatformName || null,
          anime.externalFreeWatchUrl || null,
          anime.createdAt || new Date().toISOString(),
          new Date().toISOString(),
        ],
      });

      if (Array.isArray(anime.aliases)) {
        for (const al of anime.aliases) {
          statements.push({
            sql: `INSERT OR REPLACE INTO anime_titles (id, anime_id, locale, title, title_type, normalized_title)
                  VALUES (?, ?, ?, ?, ?, ?);`,
            args: [
              al.id || `alias-${anime.id}-${Math.random().toString(36).slice(2, 7)}`,
              anime.id,
              al.locale || 'id-ID',
              al.title,
              al.titleType || 'alias',
              al.normalizedTitle || al.title.toLowerCase(),
            ],
          });
        }
      }
    }

    // 1. Insert Episode
    statements.push({
      sql: `INSERT INTO episodes (
        id, anime_id, season_id, ordinal, display_number, episode_type,
        title, duration_minutes, publish_state, airing_state, subtitle_state,
        watchability_state, external_watch_url, external_platform_name, aired_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        ordinal=excluded.ordinal,
        display_number=excluded.display_number,
        airing_state=excluded.airing_state,
        subtitle_state=excluded.subtitle_state,
        watchability_state=excluded.watchability_state,
        updated_at=excluded.updated_at;`,
      args: [
        episode.id,
        episode.animeId,
        episode.seasonId ?? null,
        episode.ordinal,
        episode.displayNumber,
        episode.episodeType || 'standard',
        episode.title ?? null,
        episode.durationMinutes ?? null,
        episode.publishState || 'published',
        episode.airingState || 'aired',
        episode.subtitleState || 'available',
        episode.watchabilityState || 'eligible_verified',
        episode.externalWatchUrl ?? null,
        episode.externalPlatformName ?? null,
        episode.airedAt ?? null,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    });

    // 2. Insert Variants
    for (const v of variants) {
      statements.push({
        sql: `INSERT INTO stream_variants (
          id, episode_id, provider_id, provider_name, quality_label, source_ref,
          embed_url, audio_locale, subtitle_locale, priority, verification_state,
          moderation_state, last_checked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          provider_name=excluded.provider_name,
          quality_label=excluded.quality_label,
          embed_url=excluded.embed_url,
          verification_state=excluded.verification_state,
          moderation_state=excluded.moderation_state,
          last_checked_at=excluded.last_checked_at;`,
        args: [
          v.id,
          v.episodeId,
          v.providerId,
          v.providerName,
          v.qualityLabel,
          v.sourceRef || v.id,
          v.embedUrl,
          v.audioLocale || 'ja-JP',
          v.subtitleLocale || 'id-ID',
          v.priority ?? 0,
          v.verificationState || 'verified',
          v.moderationState || 'approved',
          v.lastCheckedAt ?? new Date().toISOString(),
        ],
      });
    }

    // 3. Update total canonical episodes on anime if provided
    if (animeUpdate && animeUpdate.totalCanonicalEpisodes) {
      statements.push({
        sql: `UPDATE anime SET total_canonical_episodes = MAX(COALESCE(total_canonical_episodes, 0), ?), updated_at = ? WHERE id = ?;`,
        args: [animeUpdate.totalCanonicalEpisodes, new Date().toISOString(), animeUpdate.id],
      });
      statements.push({
        sql: `UPDATE seasons SET 
          canonical_episodes_count = MAX(COALESCE(canonical_episodes_count, 0), ?),
          verified_episodes_count = MAX(COALESCE(verified_episodes_count, 0), ?),
          aired_episodes_count = MAX(COALESCE(aired_episodes_count, 0), ?),
          updated_at = ?
          WHERE anime_id = ?;`,
        args: [animeUpdate.totalCanonicalEpisodes, animeUpdate.totalCanonicalEpisodes, animeUpdate.totalCanonicalEpisodes, new Date().toISOString(), animeUpdate.id],
      });
    }

    await client.batch(statements, 'write');
  }
}
