export type MediaType = 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special';
export type AiringStatus = 'scheduled' | 'airing' | 'completed' | 'cancelled';
export type PublishState = 'draft' | 'published' | 'archived';

export type AiringState = 'scheduled' | 'airing' | 'aired' | 'delayed' | 'cancelled' | 'unknown';
export type SubtitleState = 'unknown' | 'not_available' | 'pending' | 'available';
export type WatchabilityState = 'unknown' | 'eligible_verified' | 'unavailable' | 'restricted' | 'under_review';

export type SeasonReadinessState = 
  | 'READY_COMPLETE' 
  | 'READY_ONGOING' 
  | 'INCOMPLETE' 
  | 'AWAITING_EPISODE' 
  | 'SOURCE_UNVERIFIED' 
  | 'UNAVAILABLE';

export interface Season {
  id: string;
  animeId: string;
  seasonNumber: number;
  title: string;
  year: number;
  seasonPeriod: 'Winter' | 'Spring' | 'Summer' | 'Fall';
  canonicalEpisodesCount: number;
  airedEpisodesCount: number;
  verifiedEpisodesCount: number;
  missingEpisodes: number[];
  readinessState: SeasonReadinessState;
  licenseType: 'free_embed' | 'official_partner' | 'svod_exclusive' | 'unlicensed';
  externalFreeWatchUrl?: string;
  officialPlatformName?: string;
  notes?: string;
  updatedAt: string;
}

export interface Anime {
  id: string;
  canonicalTitle: string;
  slug: string;
  mediaType: MediaType;
  synopsis: string;
  firstAirDate: string;
  year: number;
  seasonPeriod: 'Winter' | 'Spring' | 'Summer' | 'Fall';
  maturityRating: string;
  airingStatus: AiringStatus;
  publishState: PublishState;
  posterUrl: string;
  bannerUrl: string;
  genres: string[];
  aliases?: AnimeTitle[];
  // Season-Level Verification & Schedule
  seasonReadinessState?: SeasonReadinessState;
  totalCanonicalEpisodes?: number;
  scheduleWIB?: string;
  officialPlatformName?: string;
  externalFreeWatchUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnimeTitle {
  id: string;
  animeId: string;
  locale: string;
  title: string;
  titleType: 'canonical' | 'romaji' | 'japanese' | 'english' | 'indonesian' | 'alias';
  normalizedTitle: string;
}

export interface Episode {
  id: string;
  animeId: string;
  seasonId?: string;
  ordinal: number;
  displayNumber: string;
  episodeType: 'standard' | 'recap' | 'special' | 'ova';
  title: string;
  durationMinutes?: number;
  publishState: PublishState;
  airedAt?: string;
  // Tri-State Status for this episode
  airingState: AiringState;
  subtitleState: SubtitleState;
  watchabilityState: WatchabilityState;
  // Official External Platform Redirection (when in-site embed is unavailable)
  externalWatchUrl?: string;
  externalPlatformName?: string;
}

export type QualityLabel = 'Auto' | '360p' | '480p' | '720p' | '1080p' | '4K';

export interface Provider {
  id: string;
  name: string;
  domain: string;
  providerType: 'embed' | 'open_external';
  apiAdapterKey: 'youtube' | 'custom_embed' | 'direct_stream';
  status: 'active' | 'paused' | 'blocked';
  termsUrl?: string;
}

export interface StreamVariant {
  id: string;
  episodeId: string;
  providerId: string;
  providerName: string;
  qualityLabel: QualityLabel;
  sourceRef: string;
  embedUrl: string;
  audioLocale: string;
  subtitleLocale: string;
  priority: number;
  verificationState: 'verified' | 'unverified' | 'degraded' | 'offline';
  moderationState: 'approved' | 'paused' | 'takedown';
  lastCheckedAt: string;
}

export interface WatchlistEntry {
  animeId: string;
  status: 'plan_to_watch' | 'watching' | 'completed' | 'on_hold' | 'dropped';
  updatedAt: string;
}

export interface EpisodeProgress {
  episodeId: string;
  animeId: string;
  watched: boolean;
  positionSeconds?: number;
  sourceVariantId?: string;
  updatedAt: string;
}

export interface AdPlacement {
  id: string;
  slotKey: 'home_leaderboard' | 'anime_detail_inline' | 'watch_below_controls' | 'search_inline';
  name: string;
  deviceRules: 'all' | 'mobile_only' | 'desktop_only';
  approved: boolean;
}

export interface AdCampaign {
  id: string;
  name: string;
  sponsorName: string;
  slotKey: string;
  imageUrl: string;
  destinationUrl: string;
  status: 'active' | 'paused' | 'completed';
  impressions: number;
  clicks: number;
}

export interface MerchItem {
  id: string;
  name: string;
  animeId: string;
  animeTitle: string;
  price: number;
  currency: string;
  imageUrl: string;
  storeName: string;
  destinationUrl: string;
  isAffiliate: boolean;
  verificationState: 'verified' | 'stale';
}

export interface BrokenStreamReport {
  id: string;
  variantId: string;
  episodeId: string;
  reason: 'broken_embed' | 'wrong_episode' | 'subtitle_issue' | 'geo_restricted' | 'copyright_issue' | 'other';
  notes?: string;
  reportedAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface AuditLog {
  id: string;
  actorId: string;
  role: string;
  action: string;
  resource: string;
  reason?: string;
  timestamp: string;
}

export interface HomepageSectionConfig {
  id: 'hero' | 'continue_watching' | 'latest_episodes' | 'ad_banner' | 'popular';
  name: string;
  enabled: boolean;
}

export interface HomepageConfig {
  heroAnimeId: string;
  sections: HomepageSectionConfig[];
}

export interface MetadataIngestCandidate {
  id: string;
  sourceApi: 'anilist' | 'mal';
  externalId: number;
  canonicalTitle: string;
  romajiTitle: string;
  englishTitle?: string;
  year: number;
  seasonPeriod: 'Winter' | 'Spring' | 'Summer' | 'Fall';
  mediaType: MediaType;
  genres: string[];
  synopsis: string;
  posterUrl: string;
  bannerUrl: string;
  totalEpisodes?: number;
  duplicateMatchId?: string;
  duplicateReason?: string;
}

export interface FranchiseWatchOrderItem {
  id: string;
  franchiseId: string;
  franchiseName: string;
  orderNumber: number;
  animeId?: string;
  title: string;
  slug?: string;
  year: number;
  type: 'TV Series' | 'Movie' | 'OVA' | 'Special';
  canonStatus: 'Canon' | 'Canon Movie' | 'Filler / Optional';
  episodesCount: number;
  note?: string;
}

export interface AnimeCharacter {
  id: string;
  animeId: string;
  name: string;
  role: 'Main' | 'Supporting';
  imageUrl: string;
  voiceActorName: string;
  voiceActorLanguage: string;
}

export interface EpisodeComment {
  id: string;
  episodeId: string;
  authorName: string;
  avatarUrl?: string;
  content: string;
  isSpoiler: boolean;
  likes: number;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  isLoggedIn: boolean;
  syncedAt?: string;
}

