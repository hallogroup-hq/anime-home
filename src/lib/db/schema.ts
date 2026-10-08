import { pgTable, text, integer, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. KATALOG ANIME
export const anime = pgTable('anime', {
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 2. ALIAS JUDUL MULTI-SCRIPT & MULTI-BAHASA
export const animeTitles = pgTable('anime_titles', {
  id: text('id').primaryKey(),
  animeId: text('anime_id').notNull().references(() => anime.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  title: text('title').notNull(),
  titleType: text('title_type').notNull(), // canonical, romaji, japanese, english, indonesian
  normalizedTitle: text('normalized_title').notNull(),
});

// 3. EPISODE
export const episodes = pgTable('episodes', {
  id: text('id').primaryKey(),
  animeId: text('anime_id').notNull().references(() => anime.id, { onDelete: 'cascade' }),
  ordinal: integer('ordinal').notNull(),
  displayNumber: text('display_number').notNull(),
  episodeType: text('episode_type').default('standard').notNull(),
  title: text('title'),
  durationMinutes: integer('duration_minutes'),
  publishState: text('publish_state').default('published').notNull(),
  airingState: text('airing_state').default('aired').notNull(),
  subtitleState: text('subtitle_state').default('available').notNull(),
  watchabilityState: text('watchability_state').default('eligible_verified').notNull(),
  airedAt: timestamp('aired_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 4. PROVIDER REGISTRY
export const providers = pgTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  domain: text('domain').notNull(),
  providerType: text('provider_type').notNull(),
  apiAdapterKey: text('api_adapter_key').notNull(),
  status: text('status').default('active').notNull(),
  termsUrl: text('terms_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 5. STREAM VARIANTS (MULTI-PROVIDER PER RESOLUTION INVARIANT)
export const streamVariants = pgTable('stream_variants', {
  id: text('id').primaryKey(),
  episodeId: text('episode_id').notNull().references(() => episodes.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').notNull().references(() => providers.id),
  providerName: text('provider_name').notNull(),
  qualityLabel: text('quality_label').notNull(), // Auto, 360p, 480p, 720p, 1080p, 4K
  sourceRef: text('source_ref').notNull(),
  embedUrl: text('embed_url').notNull(),
  audioLocale: text('audio_locale').default('ja-JP'),
  subtitleLocale: text('subtitle_locale').default('id-ID'),
  priority: integer('priority').default(0),
  verificationState: text('verification_state').default('verified').notNull(),
  moderationState: text('moderation_state').default('approved').notNull(),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 6. DIREKTORI KARAKTER & SEIYUU
export const characters = pgTable('characters', {
  id: text('id').primaryKey(),
  animeId: text('anime_id').notNull().references(() => anime.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  japaneseName: text('japanese_name'),
  role: text('role').notNull(),
  imageUrl: text('image_url').notNull(),
  voiceActorName: text('voice_actor_name').notNull(),
  voiceActorLanguage: text('voice_actor_language').default('Japanese').notNull(),
});

// 7. PANDUAN URUTAN TONTONAN WARALABA (WATCH ORDER)
export const watchOrders = pgTable('watch_orders', {
  id: text('id').primaryKey(),
  franchiseId: text('franchise_id').notNull(),
  franchiseName: text('franchise_name').notNull(),
  animeId: text('anime_id').references(() => anime.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  slug: text('slug'),
  releaseYear: integer('release_year').notNull(),
  releaseOrder: integer('release_order').notNull(),
  chronologicalOrder: integer('chronological_order').notNull(),
  type: text('type').notNull(),
  isCanon: boolean('is_canon').default(true).notNull(),
  note: text('note'),
});

// 8. MERCHANDISE RESMI
export const merchandise = pgTable('merchandise', {
  id: text('id').primaryKey(),
  animeId: text('anime_id').references(() => anime.id, { onDelete: 'set null' }),
  animeTitle: text('anime_title').notNull(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  storeName: text('store_name').notNull(),
  destinationUrl: text('destination_url').notNull(),
  imageUrl: text('image_url').notNull(),
  isAffiliate: boolean('is_affiliate').default(false).notNull(),
});

// 9. DISKUSI KOMENTAR EPISODE (RAMAH SPOILER)
export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  episodeId: text('episode_id').notNull().references(() => episodes.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  username: text('username').notNull(),
  avatarUrl: text('avatar_url').notNull(),
  content: text('content').notNull(),
  isSpoiler: boolean('is_spoiler').default(false).notNull(),
  likesCount: integer('likes_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 10. LAPORAN PEMUTAR VIDEO RUSAK
export const brokenReports = pgTable('broken_reports', {
  id: text('id').primaryKey(),
  variantId: text('variant_id').notNull(),
  episodeId: text('episode_id').notNull(),
  reason: text('reason').notNull(),
  notes: text('notes'),
  status: text('status').default('pending').notNull(),
  reportedAt: timestamp('reported_at', { withTimezone: true }).defaultNow().notNull(),
});

// 11. HOMEPAGE VISUAL CMS CONFIG
export const homepageConfigs = pgTable('homepage_configs', {
  id: text('id').primaryKey(),
  heroAnimeId: text('hero_anime_id').notNull(),
  sections: text('sections').notNull(), // JSON string array of modules
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 12. IKLAN & SPONSOR
export const adCampaigns = pgTable('ad_campaigns', {
  id: text('id').primaryKey(),
  slotKey: text('slot_key').notNull(),
  sponsorName: text('sponsor_name').notNull(),
  bannerUrl: text('banner_url').notNull(),
  targetUrl: text('target_url').notNull(),
  active: boolean('active').default(true).notNull(),
});

// 13. AUDIT LOGS
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  action: text('action').notNull(),
  target: text('target').notNull(),
  details: text('details').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// 14. PROFIL PENGGUNA
export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull(),
  avatarUrl: text('avatar_url'),
  isLoggedIn: boolean('is_logged_in').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// RELASI DRIZZLE
export const animeRelations = relations(anime, ({ many }) => ({
  titles: many(animeTitles),
  episodes: many(episodes),
  characters: many(characters),
  watchOrders: many(watchOrders),
  merchandise: many(merchandise),
}));

export const episodeRelations = relations(episodes, ({ one, many }) => ({
  anime: one(anime, { fields: [episodes.animeId], references: [anime.id] }),
  variants: many(streamVariants),
  comments: many(comments),
}));

export const streamVariantRelations = relations(streamVariants, ({ one }) => ({
  episode: one(episodes, { fields: [streamVariants.episodeId], references: [episodes.id] }),
  provider: one(providers, { fields: [streamVariants.providerId], references: [providers.id] }),
}));
