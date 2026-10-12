import { getTursoClient } from '../src/lib/db/tursoClient';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const LIVE_DATA_PATH = path.resolve(__dirname, '../src/lib/data/live_data.json');

async function syncAllToTurso() {
  const client = getTursoClient();
  if (!client) throw new Error('TURSO_DATABASE_URL tidak ditemukan!');

  console.log('🔄 Memulai sinkronisasi penuh dari live_data.json ke Database Turso...');
  const live = JSON.parse(fs.readFileSync(LIVE_DATA_PATH, 'utf8'));

  // 1. Sync Anime
  console.log(`⏳ Memeriksa ${live.anime.length} anime...`);
  const animeBatch = 50;
  for (let i = 0; i < live.anime.length; i += animeBatch) {
    const chunk = live.anime.slice(i, i + animeBatch);
    const statements = chunk.map((a: any) => ({
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
        a.id,
        a.canonicalTitle,
        a.slug,
        a.mediaType || 'TV',
        a.synopsis || null,
        a.firstAirDate || null,
        a.year || null,
        a.seasonPeriod || null,
        a.maturityRating || 'PG-13',
        a.airingStatus,
        a.publishState || 'published',
        a.posterUrl || null,
        a.bannerUrl || null,
        JSON.stringify(a.genres || []),
        a.seasonReadinessState || null,
        a.totalCanonicalEpisodes || null,
        a.scheduleWIB || null,
        a.officialPlatformName || null,
        a.externalFreeWatchUrl || null,
        a.createdAt || new Date().toISOString(),
        a.updatedAt || new Date().toISOString(),
      ],
    }));
    await client.batch(statements, 'write');
  }

  // 2. Sync Episodes
  console.log(`⏳ Memeriksa ${live.episodes.length} episodes...`);
  const epBatch = 100;
  for (let i = 0; i < live.episodes.length; i += epBatch) {
    const chunk = live.episodes.slice(i, i + epBatch);
    const statements = chunk.map((e: any) => ({
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
        e.id,
        e.animeId,
        e.seasonId || null,
        e.ordinal,
        e.displayNumber,
        e.episodeType || 'standard',
        e.title || null,
        e.durationMinutes || null,
        e.publishState || 'published',
        e.airingState || 'aired',
        e.subtitleState || 'available',
        e.watchabilityState || 'eligible_verified',
        e.externalWatchUrl || null,
        e.externalPlatformName || null,
        e.airedAt || null,
        e.createdAt || new Date().toISOString(),
        e.updatedAt || new Date().toISOString(),
      ],
    }));
    await client.batch(statements, 'write');
  }

  // 3. Sync Variants
  console.log(`⏳ Memeriksa ${live.variants.length} stream variants...`);
  const varBatch = 100;
  for (let i = 0; i < live.variants.length; i += varBatch) {
    const chunk = live.variants.slice(i, i + varBatch);
    const statements = chunk.map((v: any) => ({
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
        v.id || `var-${Math.random().toString(36).slice(2, 9)}`,
        v.episodeId,
        v.providerId || 'prov-unknown',
        v.providerName || 'Server Cadangan',
        v.qualityLabel || '720p',
        v.sourceRef || v.id || '',
        v.embedUrl || '',
        v.audioLocale || 'ja-JP',
        v.subtitleLocale || 'id-ID',
        v.priority ?? 0,
        v.verificationState || 'verified',
        v.moderationState || 'approved',
        v.lastCheckedAt ?? null,
      ],
    }));
    await client.batch(statements, 'write');
  }

  console.log('✅ SINKRONISASI LENGKAP KE TURSO SELESAI!');
}

syncAllToTurso().catch(console.error);
