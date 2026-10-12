import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 1. ANIME
export const animeTable = sqliteTable('anime', {
  id: text('id').primaryKey(),
  canonicalTitle: text('canonical_title').notNull(),
  slug: text('slug').notNull().unique(),
  mediaType: text('media_type').notNull(),
  synopsis: text('synopsis'),
  firstAirDate: text('first_air_date'),
  year: integer('year'),
  seasonPeriod: text('season_period'),
  maturityRating: text('maturity_rating').default('PG-13'),
  airingStatus: text('airing_status').notNull(),
  publishState: text('publish_state').default('published').notNull(),
  posterUrl: text('poster_url'),
  bannerUrl: text('banner_url'),
  genres: text('genres').notNull(), // JSON string array
  seasonReadinessState: text('season_readiness_state'),
  totalCanonicalEpisodes: integer('total_canonical_episodes'),
  scheduleWIB: text('schedule_wib'),
  officialPlatformName: text('official_platform_name'),
  externalFreeWatchUrl: text('external_free_watch_url'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// 2. ALIAS JUDUL
export const animeTitlesTable = sqliteTable('anime_titles', {
  id: text('id').primaryKey(),
  animeId: text('anime_id').notNull().references(() => animeTable.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  title: text('title').notNull(),
  titleType: text('title_type').notNull(),
  normalizedTitle: text('normalized_title').notNull(),
});

// 3. EPISODES
export const episodesTable = sqliteTable('episodes', {
  id: text('id').primaryKey(),
  animeId: text('anime_id').notNull().references(() => animeTable.id, { onDelete: 'cascade' }),
  seasonId: text('season_id'),
  ordinal: integer('ordinal').notNull(),
  displayNumber: text('display_number').notNull(),
  episodeType: text('episode_type').default('standard').notNull(),
  title: text('title'),
  durationMinutes: integer('duration_minutes'),
  publishState: text('publish_state').default('published').notNull(),
  airingState: text('airing_state').default('aired').notNull(),
  subtitleState: text('subtitle_state').default('available').notNull(),
  watchabilityState: text('watchability_state').default('eligible_verified').notNull(),
  externalWatchUrl: text('external_watch_url'),
  externalPlatformName: text('external_platform_name'),
  airedAt: text('aired_at'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// 4. STREAM VARIANTS
export const streamVariantsTable = sqliteTable('stream_variants', {
  id: text('id').primaryKey(),
  episodeId: text('episode_id').notNull().references(() => episodesTable.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').notNull(),
  providerName: text('provider_name').notNull(),
  qualityLabel: text('quality_label').notNull(),
  sourceRef: text('source_ref').notNull(),
  embedUrl: text('embed_url').notNull(),
  audioLocale: text('audio_locale').default('ja-JP'),
  subtitleLocale: text('subtitle_locale').default('id-ID'),
  priority: integer('priority').default(0),
  verificationState: text('verification_state').default('verified').notNull(),
  moderationState: text('moderation_state').default('approved').notNull(),
  lastCheckedAt: text('last_checked_at'),
});

// 5. SEASONS
export const seasonsTable = sqliteTable('seasons', {
  id: text('id').primaryKey(),
  animeId: text('anime_id').notNull().references(() => animeTable.id, { onDelete: 'cascade' }),
  seasonNumber: integer('season_number').notNull(),
  title: text('title').notNull(),
  year: integer('year'),
  seasonPeriod: text('season_period'),
  canonicalEpisodesCount: integer('canonical_episodes_count'),
  airedEpisodesCount: integer('aired_episodes_count'),
  verifiedEpisodesCount: integer('verified_episodes_count'),
  missingEpisodes: text('missing_episodes'), // JSON string array
  readinessState: text('readiness_state'),
  licenseType: text('license_type'),
  externalFreeWatchUrl: text('external_free_watch_url'),
  officialPlatformName: text('official_platform_name'),
  notes: text('notes'),
  updatedAt: text('updated_at'),
});

// 6. CHARACTERS & SEIYUU
export const charactersTable = sqliteTable('characters', {
  id: text('id').primaryKey(),
  animeId: text('anime_id').notNull().references(() => animeTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role').notNull(),
  imageUrl: text('image_url').notNull(),
  voiceActorName: text('voice_actor_name').notNull(),
  voiceActorLanguage: text('voice_actor_language').default('Japanese').notNull(),
});
