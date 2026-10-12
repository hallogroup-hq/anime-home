import fs from 'fs';
import path from 'path';
import { getTursoClient } from '../src/lib/db/tursoClient';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const LIVE_DATA_PATH = path.resolve(__dirname, '../src/lib/data/live_data.json');

async function main() {
  const client = getTursoClient();
  if (!client) {
    throw new Error('TURSO_DATABASE_URL tidak ditemukan di environment!');
  }

  console.log('🚀 Memulai inisialisasi tabel di database Turso...');

  // 1. Create Tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS anime (
      id TEXT PRIMARY KEY,
      canonical_title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      media_type TEXT NOT NULL,
      synopsis TEXT,
      first_air_date TEXT,
      year INTEGER,
      season_period TEXT,
      maturity_rating TEXT DEFAULT 'PG-13',
      airing_status TEXT NOT NULL,
      publish_state TEXT NOT NULL DEFAULT 'published',
      poster_url TEXT,
      banner_url TEXT,
      genres TEXT NOT NULL,
      season_readiness_state TEXT,
      total_canonical_episodes INTEGER,
      schedule_wib TEXT,
      official_platform_name TEXT,
      external_free_watch_url TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS anime_titles (
      id TEXT PRIMARY KEY,
      anime_id TEXT NOT NULL,
      locale TEXT NOT NULL,
      title TEXT NOT NULL,
      title_type TEXT NOT NULL,
      normalized_title TEXT NOT NULL,
      FOREIGN KEY (anime_id) REFERENCES anime(id) ON DELETE CASCADE
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS episodes (
      id TEXT PRIMARY KEY,
      anime_id TEXT NOT NULL,
      season_id TEXT,
      ordinal INTEGER NOT NULL,
      display_number TEXT NOT NULL,
      episode_type TEXT NOT NULL DEFAULT 'standard',
      title TEXT,
      duration_minutes INTEGER,
      publish_state TEXT NOT NULL DEFAULT 'published',
      airing_state TEXT NOT NULL DEFAULT 'aired',
      subtitle_state TEXT NOT NULL DEFAULT 'available',
      watchability_state TEXT NOT NULL DEFAULT 'eligible_verified',
      external_watch_url TEXT,
      external_platform_name TEXT,
      aired_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (anime_id) REFERENCES anime(id) ON DELETE CASCADE
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS stream_variants (
      id TEXT PRIMARY KEY,
      episode_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      quality_label TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      embed_url TEXT NOT NULL,
      audio_locale TEXT DEFAULT 'ja-JP',
      subtitle_locale TEXT DEFAULT 'id-ID',
      priority INTEGER DEFAULT 0,
      verification_state TEXT NOT NULL DEFAULT 'verified',
      moderation_state TEXT NOT NULL DEFAULT 'approved',
      last_checked_at TEXT,
      FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS seasons (
      id TEXT PRIMARY KEY,
      anime_id TEXT NOT NULL,
      season_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      year INTEGER,
      season_period TEXT,
      canonical_episodes_count INTEGER,
      aired_episodes_count INTEGER,
      verified_episodes_count INTEGER,
      missing_episodes TEXT,
      readiness_state TEXT,
      license_type TEXT,
      external_free_watch_url TEXT,
      official_platform_name TEXT,
      notes TEXT,
      updated_at TEXT,
      FOREIGN KEY (anime_id) REFERENCES anime(id) ON DELETE CASCADE
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      anime_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      image_url TEXT NOT NULL,
      voice_actor_name TEXT NOT NULL,
      voice_actor_language TEXT DEFAULT 'Japanese' NOT NULL,
      FOREIGN KEY (anime_id) REFERENCES anime(id) ON DELETE CASCADE
    );
  `);

  // Create useful indexes for fast queries
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_anime_slug ON anime(slug);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_episodes_anime_id ON episodes(anime_id);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_episodes_ordinal ON episodes(anime_id, ordinal);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_stream_variants_ep_id ON stream_variants(episode_id);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_anime_titles_anime_id ON anime_titles(anime_id);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_characters_anime_id ON characters(anime_id);`);
  await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_anime_name ON characters(anime_id, name);`);

  console.log('✅ Tabel dan indeks berhasil dibuat di Turso.');

  // 2. Read live_data.json and seed
  console.log('📦 Membaca live_data.json untuk migrasi data...');
  const raw = fs.readFileSync(LIVE_DATA_PATH, 'utf8');
  const liveData = JSON.parse(raw);

  const animeList = liveData.anime || [];
  const episodesList = liveData.episodes || [];
  const variantsList = liveData.variants || [];
  const seasonsList = liveData.seasons || [];

  console.log(`Ditemukan: ${animeList.length} anime, ${episodesList.length} episode, ${variantsList.length} stream variant, ${seasonsList.length} season.`);

  // Seed Anime (in batches of 50)
  console.log('⏳ Menyimpan anime...');
  const animeBatchSize = 50;
  for (let i = 0; i < animeList.length; i += animeBatchSize) {
    const chunk = animeList.slice(i, i + animeBatchSize);
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
        a.mediaType,
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
  console.log(`✅ ${animeList.length} anime tersimpan.`);

  // Seed Aliases
  const allAliases: any[] = [];
  for (const a of animeList) {
    if (Array.isArray(a.aliases)) {
      for (const al of a.aliases) {
        allAliases.push({
          id: al.id || `alias-${a.id}-${Math.random().toString(36).slice(2, 7)}`,
          animeId: a.id,
          locale: al.locale || 'id-ID',
          title: al.title,
          titleType: al.titleType || 'alias',
          normalizedTitle: al.normalizedTitle || al.title.toLowerCase(),
        });
      }
    }
  }
  if (allAliases.length > 0) {
    console.log(`⏳ Menyimpan ${allAliases.length} alias judul anime...`);
    for (let i = 0; i < allAliases.length; i += 100) {
      const chunk = allAliases.slice(i, i + 100);
      const statements = chunk.map((al: any) => ({
        sql: `INSERT OR REPLACE INTO anime_titles (id, anime_id, locale, title, title_type, normalized_title)
              VALUES (?, ?, ?, ?, ?, ?);`,
        args: [al.id, al.animeId, al.locale, al.title, al.titleType, al.normalizedTitle],
      }));
      await client.batch(statements, 'write');
    }
    console.log(`✅ ${allAliases.length} alias judul tersimpan.`);
  }

  // Seed Seasons
  const validSeasons = seasonsList.filter((s: any) => animeList.some((a: any) => a.id === s.animeId));
  if (validSeasons.length > 0) {
    console.log(`⏳ Menyimpan ${validSeasons.length} season...`);
    for (let i = 0; i < validSeasons.length; i += 50) {
      const chunk = validSeasons.slice(i, i + 50);
      const statements = chunk.map((s: any) => ({
        sql: `INSERT INTO seasons (
          id, anime_id, season_number, title, year, season_period,
          canonical_episodes_count, aired_episodes_count, verified_episodes_count,
          missing_episodes, readiness_state, license_type, external_free_watch_url,
          official_platform_name, notes, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          canonical_episodes_count=excluded.canonical_episodes_count,
          aired_episodes_count=excluded.aired_episodes_count,
          verified_episodes_count=excluded.verified_episodes_count,
          updated_at=excluded.updated_at;`,
        args: [
          s.id,
          s.animeId,
          s.seasonNumber || 1,
          s.title || `Season ${s.seasonNumber || 1}`,
          s.year || null,
          s.seasonPeriod || null,
          s.canonicalEpisodesCount || null,
          s.airedEpisodesCount || null,
          s.verifiedEpisodesCount || null,
          JSON.stringify(s.missingEpisodes || []),
          s.readinessState || null,
          s.licenseType || null,
          s.externalFreeWatchUrl || null,
          s.officialPlatformName || null,
          s.notes || null,
          s.updatedAt || new Date().toISOString(),
        ],
      }));
      await client.batch(statements, 'write');
    }
    console.log(`✅ ${validSeasons.length} season tersimpan.`);
  }

  // Seed Episodes (in batches of 100)
  console.log(`⏳ Menyimpan ${episodesList.length} episode...`);
  const epBatchSize = 100;
  for (let i = 0; i < episodesList.length; i += epBatchSize) {
    const chunk = episodesList.slice(i, i + epBatchSize);
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
  console.log(`✅ ${episodesList.length} episode tersimpan.`);

  // Seed Stream Variants (in batches of 100)
  console.log(`⏳ Menyimpan ${variantsList.length} stream variant...`);
  const varBatchSize = 100;
  for (let i = 0; i < variantsList.length; i += varBatchSize) {
    const chunk = variantsList.slice(i, i + varBatchSize);
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
  console.log(`✅ ${variantsList.length} stream variants tersimpan.`);

  console.log('\n====================================================');
  console.log('🎉 MIGRASI KE DATABASE TURSO SELESAI DENGAN SUKSES!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('❌ Gagal migrasi ke Turso:', err);
  process.exit(1);
});
