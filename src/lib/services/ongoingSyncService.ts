import fs from 'fs';
import path from 'path';
import { db } from '@/lib/services/store';
import { Anime, Episode, Season, StreamVariant } from '@/types';
import { getOngoingAnime, getAnimeDetails, getEpisodeStreams } from '@/lib/services/otakudesuScraper.mjs';
import { SamehadakuScraper } from '@/lib/services/samehadakuScraper';

const LIVE_DATA_PATH = path.resolve('src/lib/data/live_data.json');

export interface SyncUpdateItem {
  animeId: string;
  animeTitle: string;
  isNewAnime: boolean;
  episodeNumber: number;
  displayNumber: string;
  episodeTitle: string;
  sourceUrl: string;
  sourceName: 'Samehadaku' | 'Otakudesu' | 'DualSource';
  variantsAdded: number;
  providers: string[];
}

export interface OngoingSyncReport {
  timestamp: string;
  status: 'success' | 'no_updates' | 'error';
  checkedAnimeCount: number;
  newAnimeCount: number;
  newEpisodesCount: number;
  updates: SyncUpdateItem[];
  message: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export class OngoingSyncService {
  /**
   * Helper to find or auto-ingest anime and season in store
   */
  private static getOrCreateAnime(
    rawTitle: string,
    posterUrl: string,
    epNum: number,
    scheduleDay: string,
    synopsisText?: string,
    genresList?: string[],
    dryRun?: boolean
  ): { anime: Anime; isNew: boolean } {
    const timestamp = new Date().toISOString();
    const normTitle = rawTitle.toLowerCase().replace(/[^a-z0-9]/g, ' ');

    const allAnime = db.getAnimeList();
    const matched = allAnime.find(a => {
      const normA = a.canonicalTitle.toLowerCase().replace(/[^a-z0-9]/g, ' ');
      if (normA === normTitle || normA.includes(normTitle) || normTitle.includes(normA)) return true;
      for (const al of a.aliases || []) {
        const normAl = al.title.toLowerCase().replace(/[^a-z0-9]/g, ' ');
        if (normAl.length > 4 && (normTitle.includes(normAl) || normAl.includes(normTitle))) return true;
      }
      return false;
    });

    if (matched) {
      return { anime: matched, isNew: false };
    }

    // Auto-create new anime
    const baseSlug = slugify(rawTitle);
    const animeId = `anime-${baseSlug}`;

    const newAnime: Anime = {
      id: animeId,
      canonicalTitle: rawTitle,
      slug: baseSlug,
      mediaType: 'TV',
      synopsis: synopsisText || `Serial anime ${rawTitle} subtitle Indonesia. Tayang berkala dengan update episode terbaru di Anime Home.`,
      firstAirDate: new Date().toISOString().split('T')[0],
      year: 2026,
      seasonPeriod: 'Fall',
      maturityRating: 'PG-13',
      airingStatus: 'airing',
      publishState: 'published',
      posterUrl: posterUrl,
      bannerUrl: posterUrl,
      genres: genresList && genresList.length > 0 ? genresList : ['Action', 'Fantasy', 'Shounen'],
      aliases: [
        {
          id: `title-${baseSlug}-primary`,
          animeId,
          locale: 'id-ID',
          title: rawTitle,
          titleType: 'canonical',
          normalizedTitle: baseSlug,
        }
      ],
      totalCanonicalEpisodes: epNum,
      scheduleWIB: `${scheduleDay || 'Berkala'}, 19:00 WIB`,
      seasonReadinessState: 'READY_ONGOING',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const seasonMatch = rawTitle.match(/season\s*(\d+)/i) || rawTitle.match(/s(\d+)/i);
    const seasonNum = seasonMatch ? parseInt(seasonMatch[1]) : 1;

    const newSeason: Season = {
      id: `season-${baseSlug}-s${seasonNum}`,
      animeId,
      seasonNumber: seasonNum,
      title: rawTitle,
      year: 2026,
      seasonPeriod: 'Fall',
      canonicalEpisodesCount: epNum,
      airedEpisodesCount: epNum,
      verifiedEpisodesCount: epNum,
      missingEpisodes: [],
      readinessState: 'READY_ONGOING',
      licenseType: 'free_embed',
      updatedAt: timestamp,
    };

    if (!dryRun) {
      (db as any).anime.unshift(newAnime);
      if (!Array.isArray((db as any).seasons)) (db as any).seasons = [];
      (db as any).seasons.push(newSeason);
    }

    return { anime: newAnime, isNew: true };
  }

  /**
   * Run the ongoing anime synchronization pipeline.
   * Scrapes both Samehadaku and Otakudesu.
   * Ingests brand-new ongoing anime AND newly released episodes.
   */
  public static async syncOngoingAnime(options: { dryRun?: boolean } = {}): Promise<OngoingSyncReport> {
    const timestamp = new Date().toISOString();
    console.log(`[OngoingSyncService] Starting Dual-Engine (Samehadaku + Otakudesu) sync at ${timestamp}...`);

    // 1. Preload latest state from live_data.json if exists
    if (fs.existsSync(LIVE_DATA_PATH)) {
      try {
        const liveData = JSON.parse(fs.readFileSync(LIVE_DATA_PATH, 'utf8'));
        if (Array.isArray(liveData.anime) && liveData.anime.length >= (db as any).anime.length) {
          (db as any).anime = liveData.anime;
        }
        if (Array.isArray(liveData.seasons) && liveData.seasons.length >= ((db as any).seasons || []).length) {
          (db as any).seasons = liveData.seasons;
        }
        if (Array.isArray(liveData.episodes) && liveData.episodes.length >= (db as any).episodes.length) {
          (db as any).episodes = liveData.episodes;
        }
        if (Array.isArray(liveData.variants) && liveData.variants.length >= (db as any).variants.length) {
          (db as any).variants = liveData.variants;
        }
      } catch (err: any) {
        console.warn('[OngoingSyncService] Could not preload live_data.json:', err.message);
      }
    }

    const updates: SyncUpdateItem[] = [];
    let checkedCount = 0;
    let newAnimeCount = 0;

    try {
      // 2. Fetch live data from BOTH sources
      console.log('[OngoingSyncService] Fetching latest releases from Samehadaku API...');
      const samehadaReleases = await SamehadakuScraper.getLatestReleases();
      console.log(`[OngoingSyncService] Found ${samehadaReleases.length} latest releases on Samehadaku.`);

      console.log('[OngoingSyncService] Fetching ongoing anime list from Otakudesu...');
      const otakuOngoing = await getOngoingAnime();
      console.log(`[OngoingSyncService] Found ${otakuOngoing.length} ongoing anime on Otakudesu.`);

      checkedCount = samehadaReleases.length + otakuOngoing.length;

      // -------------------------------------------------------------
      // PASS A: Process Samehadaku Releases
      // -------------------------------------------------------------
      for (const item of samehadaReleases) {
        try {
          const rawTitle = item.series_title.trim();
          const epNum = parseInt(item.episode) || 1;

          const { anime, isNew } = this.getOrCreateAnime(
            rawTitle,
            item.thumb,
            epNum,
            'Berkala',
            undefined,
            undefined,
            options.dryRun
          );

          if (isNew) {
            newAnimeCount++;
          }

          // Check if episode already exists
          const existingEps = db.getEpisodesByAnimeId(anime.id);
          const hasEp = existingEps.some(e => e.ordinal === epNum);

          if (!hasEp) {
            console.log(`[OngoingSyncService] Ingesting Episode ${epNum} for "${anime.canonicalTitle}" from Samehadaku...`);
            const displayNumber = epNum < 10 ? `0${epNum}` : `${epNum}`;
            const isAoT = anime.id.startsWith('anime-aot-');
            const episodeId = isAoT
              ? `ep-${anime.id.replace('anime-', '')}-${epNum}`
              : (anime.id.startsWith('anime-')
                  ? `ep-${anime.id.slice(6)}-${epNum}`
                  : `ep-${anime.id}-${epNum}`);

            const newEpisode: Episode = {
              id: episodeId,
              animeId: anime.id,
              ordinal: epNum,
              displayNumber,
              episodeType: 'standard',
              title: item.title || `${anime.canonicalTitle} Episode ${displayNumber}`,
              durationMinutes: 24,
              publishState: 'published',
              airedAt: timestamp,
              airingState: 'aired',
              subtitleState: 'available',
              watchabilityState: 'eligible_verified',
            };

            // Resolve streams from Samehadaku
            const samehadaStreams = await SamehadakuScraper.getEpisodeStreams(item.url);
            const newVariants: StreamVariant[] = [];
            const providersUsed: string[] = [];

            // Add Samehadaku streams
            for (let idx = 0; idx < samehadaStreams.length; idx++) {
              const s = samehadaStreams[idx];
              newVariants.push({
                id: `var-${episodeId}-sh-${idx}`,
                episodeId,
                providerId: s.serverName.toLowerCase().includes('mega') ? 'prov-mega' : 'prov-blogger',
                providerName: s.serverName,
                qualityLabel: (s.quality as any) || '720p',
                sourceRef: `${anime.id}-ep-${epNum}-sh-${idx}`,
                embedUrl: s.iframeSrc,
                audioLocale: 'ja-JP',
                subtitleLocale: 'id-ID',
                priority: 15 - idx,
                verificationState: 'verified',
                moderationState: 'approved',
                lastCheckedAt: timestamp,
              });
              providersUsed.push(s.serverName);
            }

            // Always add in-app Failover Players (Server Alpha & Beta)
            newVariants.push({
              id: `var-${episodeId}-alpha-720`,
              episodeId,
              providerId: 'prov-alpha',
              providerName: 'Server Alpha (Direct Cloud)',
              qualityLabel: '720p',
              sourceRef: `${anime.id}-ep-${epNum}-alpha-720p`,
              embedUrl: `/embed/player?title=${encodeURIComponent(anime.canonicalTitle)}&ep=${epNum}&server=Server%20Alpha&quality=720p`,
              audioLocale: 'ja-JP',
              subtitleLocale: 'id-ID',
              priority: 11,
              verificationState: 'verified',
              moderationState: 'approved',
              lastCheckedAt: timestamp,
            });
            providersUsed.push('Server Alpha');

            newVariants.push({
              id: `var-${episodeId}-beta-1080`,
              episodeId,
              providerId: 'prov-beta',
              providerName: 'Server Beta (FastStream)',
              qualityLabel: '1080p',
              sourceRef: `${anime.id}-ep-${epNum}-beta-1080p`,
              embedUrl: `/embed/player?title=${encodeURIComponent(anime.canonicalTitle)}&ep=${epNum}&server=Server%20Beta&quality=1080p`,
              audioLocale: 'ja-JP',
              subtitleLocale: 'id-ID',
              priority: 14,
              verificationState: 'verified',
              moderationState: 'approved',
              lastCheckedAt: timestamp,
            });
            providersUsed.push('Server Beta');

            if (!options.dryRun) {
              (db as any).episodes.push(newEpisode);
              for (const v of newVariants) {
                (db as any).variants.push(v);
              }

              if (!anime.totalCanonicalEpisodes || anime.totalCanonicalEpisodes < epNum) {
                anime.totalCanonicalEpisodes = epNum;
              }

              const season = db.getSeasonByAnimeId(anime.id);
              if (season) {
                season.verifiedEpisodesCount = Math.max(season.verifiedEpisodesCount, epNum);
                season.canonicalEpisodesCount = Math.max(season.canonicalEpisodesCount, epNum);
              }
            }

            updates.push({
              animeId: anime.id,
              animeTitle: anime.canonicalTitle,
              isNewAnime: isNew,
              episodeNumber: epNum,
              displayNumber,
              episodeTitle: newEpisode.title,
              sourceUrl: item.url,
              sourceName: 'Samehadaku',
              variantsAdded: newVariants.length,
              providers: providersUsed,
            });
          }
        } catch (err: any) {
          console.warn(`[OngoingSyncService] Error processing Samehadaku item ${item.series_title}:`, err.message);
        }
      }

      // -------------------------------------------------------------
      // PASS B: Process Otakudesu Ongoing Anime
      // -------------------------------------------------------------
      for (const ongoingItem of otakuOngoing) {
        try {
          const rawTitle = ongoingItem.title.trim();
          const epMatch = ongoingItem.latestEpisode.match(/Episode\s*(\d+)/i);
          const remoteEpNumber = epMatch ? parseInt(epMatch[1]) : 1;

          // Fetch details for metadata
          const details: any = await getAnimeDetails(ongoingItem.url).catch(() => ({}));

          const { anime, isNew } = this.getOrCreateAnime(
            rawTitle,
            (details as any).posterUrl || ongoingItem.posterUrl,
            remoteEpNumber,
            ongoingItem.releaseDay || 'Minggu',
            (details as any).synopsis,
            (details as any).genres,
            options.dryRun
          );

          if (isNew) {
            newAnimeCount++;
          }

          // Check current episodes in database
          const existingEps = db.getEpisodesByAnimeId(anime.id);
          const existingEpNumbers = new Set(existingEps.map(e => e.ordinal));
          const episodeList: any[] = details.episodes || [];

          for (const epInfo of episodeList) {
            const epNumMatch = epInfo.title.match(/Episode\s*(\d+)/i);
            const epNum = epNumMatch ? parseInt(epNumMatch[1]) : 1;

            if (existingEpNumbers.has(epNum)) {
              continue; // Episode already exists
            }

            console.log(`[OngoingSyncService] Ingesting Episode ${epNum} for "${anime.canonicalTitle}" from Otakudesu...`);

            const streamInfo: any = await getEpisodeStreams(epInfo.url, { resolveAllMirrors: true }).catch(() => ({}));
            const resolvedList: any[] = (streamInfo.resolvedStreams || []).filter(
              (s: any) => s.iframeSrc && !s.iframeSrc.includes('/maintenance')
            );

            const displayNumber = epNum < 10 ? `0${epNum}` : `${epNum}`;
            const isAoT = anime.id.startsWith('anime-aot-');
            const episodeId = isAoT
              ? `ep-${anime.id.replace('anime-', '')}-${epNum}`
              : (anime.id.startsWith('anime-')
                  ? `ep-${anime.id.slice(6)}-${epNum}`
                  : `ep-${anime.id}-${epNum}`);

            const newEpisode: Episode = {
              id: episodeId,
              animeId: anime.id,
              ordinal: epNum,
              displayNumber,
              episodeType: 'standard',
              title: epInfo.title || `${anime.canonicalTitle} Episode ${displayNumber}`,
              durationMinutes: 24,
              publishState: 'published',
              airedAt: timestamp,
              airingState: 'aired',
              subtitleState: 'available',
              watchabilityState: 'eligible_verified',
            };

            const newVariants: StreamVariant[] = [];
            const providersUsed: string[] = [];

            // A. Mega Cloud Player
            const megaStream: any = resolvedList.find((s: any) => s.canEmbedDirectly && s.iframeSrc?.includes('mega.nz'));
            if (megaStream) {
              newVariants.push({
                id: `var-${episodeId}-otaku-mega`,
                episodeId,
                providerId: 'prov-mega',
                providerName: 'Mega Cloud Player',
                qualityLabel: '720p',
                sourceRef: `${anime.id}-ep-${epNum}-otaku-mega`,
                embedUrl: megaStream.iframeSrc,
                audioLocale: 'ja-JP',
                subtitleLocale: 'id-ID',
                priority: 15,
                verificationState: 'verified',
                moderationState: 'approved',
                lastCheckedAt: timestamp,
              });
              providersUsed.push('Mega Cloud');
            }

            // B. Vidhide High-Speed
            const vidhideStream: any = resolvedList.find((s: any) => s.canEmbedDirectly && (s.iframeSrc?.includes('vidhide') || s.iframeSrc?.includes('odvidhide')));
            if (vidhideStream) {
              newVariants.push({
                id: `var-${episodeId}-otaku-vidhide`,
                episodeId,
                providerId: 'prov-vidhide',
                providerName: 'Vidhide High-Speed',
                qualityLabel: '720p',
                sourceRef: `${anime.id}-ep-${epNum}-otaku-vidhide`,
                embedUrl: vidhideStream.iframeSrc,
                audioLocale: 'ja-JP',
                subtitleLocale: 'id-ID',
                priority: 13,
                verificationState: 'verified',
                moderationState: 'approved',
                lastCheckedAt: timestamp,
              });
              providersUsed.push('Vidhide');
            }

            // C. DesuStream Fast CDN
            const desuStream: any = resolvedList.find((s: any) => s.iframeSrc?.includes('desustream.net'));
            if (desuStream) {
              newVariants.push({
                id: `var-${episodeId}-otaku-desu`,
                episodeId,
                providerId: 'prov-desu',
                providerName: 'DesuStream Fast CDN',
                qualityLabel: '480p',
                sourceRef: `${anime.id}-ep-${epNum}-otaku-desu`,
                embedUrl: desuStream.iframeSrc,
                audioLocale: 'ja-JP',
                subtitleLocale: 'id-ID',
                priority: 12,
                verificationState: 'verified',
                moderationState: 'approved',
                lastCheckedAt: timestamp,
              });
              providersUsed.push('DesuStream');
            }

            // In-app Failover Players
            newVariants.push({
              id: `var-${episodeId}-alpha-720`,
              episodeId,
              providerId: 'prov-alpha',
              providerName: 'Server Alpha (Direct Cloud)',
              qualityLabel: '720p',
              sourceRef: `${anime.id}-ep-${epNum}-alpha-720p`,
              embedUrl: `/embed/player?title=${encodeURIComponent(anime.canonicalTitle)}&ep=${epNum}&server=Server%20Alpha&quality=720p`,
              audioLocale: 'ja-JP',
              subtitleLocale: 'id-ID',
              priority: 11,
              verificationState: 'verified',
              moderationState: 'approved',
              lastCheckedAt: timestamp,
            });
            providersUsed.push('Server Alpha');

            newVariants.push({
              id: `var-${episodeId}-beta-1080`,
              episodeId,
              providerId: 'prov-beta',
              providerName: 'Server Beta (FastStream)',
              qualityLabel: '1080p',
              sourceRef: `${anime.id}-ep-${epNum}-beta-1080p`,
              embedUrl: `/embed/player?title=${encodeURIComponent(anime.canonicalTitle)}&ep=${epNum}&server=Server%20Beta&quality=1080p`,
              audioLocale: 'ja-JP',
              subtitleLocale: 'id-ID',
              priority: 14,
              verificationState: 'verified',
              moderationState: 'approved',
              lastCheckedAt: timestamp,
            });
            providersUsed.push('Server Beta');

            if (!options.dryRun) {
              (db as any).episodes.push(newEpisode);
              for (const v of newVariants) {
                (db as any).variants.push(v);
              }

              if (!anime.totalCanonicalEpisodes || anime.totalCanonicalEpisodes < epNum) {
                anime.totalCanonicalEpisodes = epNum;
              }

              const season = db.getSeasonByAnimeId(anime.id);
              if (season) {
                season.verifiedEpisodesCount = Math.max(season.verifiedEpisodesCount, epNum);
                season.canonicalEpisodesCount = Math.max(season.canonicalEpisodesCount, epNum);
              }
            }

            existingEpNumbers.add(epNum);
            updates.push({
              animeId: anime.id,
              animeTitle: anime.canonicalTitle,
              isNewAnime: isNew,
              episodeNumber: epNum,
              displayNumber,
              episodeTitle: newEpisode.title,
              sourceUrl: epInfo.url,
              sourceName: 'Otakudesu',
              variantsAdded: newVariants.length,
              providers: providersUsed,
            });
          }
        } catch (err: any) {
          console.warn(`[OngoingSyncService] Error processing Otakudesu item ${ongoingItem.title}:`, err.message);
        }
      }

      // -------------------------------------------------------------
      // 3. Persist to live_data.json
      // -------------------------------------------------------------
      if (!options.dryRun && updates.length > 0) {
        const payloadToSave = {
          anime: (db as any).anime,
          seasons: (db as any).seasons || [],
          episodes: (db as any).episodes,
          variants: (db as any).variants,
          lastSyncAt: timestamp,
        };
        fs.writeFileSync(LIVE_DATA_PATH, JSON.stringify(payloadToSave, null, 2), 'utf8');
        console.log(`[OngoingSyncService] Successfully persisted ${updates.length} updates to ${LIVE_DATA_PATH}`);
      }

      const report: OngoingSyncReport = {
        timestamp,
        status: updates.length > 0 ? 'success' : 'no_updates',
        checkedAnimeCount: checkedCount,
        newAnimeCount,
        newEpisodesCount: updates.length,
        updates,
        message: updates.length > 0
          ? `Pipeline Dual-Source sukses: Menemukan ${newAnimeCount} anime baru dan menambahkan ${updates.length} episode baru dengan multi-server stream!`
          : `Pipeline Dual-Source selesai: Tidak ada episode atau anime baru di Samehadaku & Otakudesu saat ini.`,
      };

      console.log(`[OngoingSyncService] Finished sync: ${report.message}`);
      return report;
    } catch (err: any) {
      console.error('[OngoingSyncService] Fatal sync failure:', err);
      return {
        timestamp,
        status: 'error',
        checkedAnimeCount: 0,
        newAnimeCount: 0,
        newEpisodesCount: 0,
        updates: [],
        message: `Sinkronisasi gagal: ${err.message}`,
      };
    }
  }
}
