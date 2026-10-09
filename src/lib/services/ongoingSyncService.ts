import fs from 'fs';
import path from 'path';
import { db } from '@/lib/services/store';
import { Episode, StreamVariant } from '@/types';
import { getOngoingAnime, getAnimeDetails, getEpisodeStreams } from '@/lib/services/otakudesuScraper.mjs';

const LIVE_DATA_PATH = path.resolve('src/lib/data/live_data.json');

export interface SyncUpdateItem {
  animeId: string;
  animeTitle: string;
  episodeNumber: number;
  displayNumber: string;
  episodeTitle: string;
  sourceUrl: string;
  variantsAdded: number;
  providers: string[];
}

export interface OngoingSyncReport {
  timestamp: string;
  status: 'success' | 'no_updates' | 'error';
  checkedAnimeCount: number;
  newEpisodesCount: number;
  updates: SyncUpdateItem[];
  message: string;
}

export class OngoingSyncService {
  /**
   * Run the ongoing anime synchronization pipeline.
   * Checks every ongoing title and automatically ingests new episodes & stream variants.
   */
  public static async syncOngoingAnime(options: { dryRun?: boolean } = {}): Promise<OngoingSyncReport> {
    const timestamp = new Date().toISOString();
    console.log(`[OngoingSyncService] Starting 2-hour periodic sync at ${timestamp}...`);

    // Synchronize latest data from live_data.json if exists on disk
    if (fs.existsSync(LIVE_DATA_PATH)) {
      try {
        const liveData = JSON.parse(fs.readFileSync(LIVE_DATA_PATH, 'utf8'));
        if (Array.isArray(liveData.episodes) && liveData.episodes.length >= (db as any).episodes.length) {
          (db as any).episodes = liveData.episodes;
        }
        if (Array.isArray(liveData.variants) && liveData.variants.length >= (db as any).variants.length) {
          (db as any).variants = liveData.variants;
        }
        if (Array.isArray(liveData.anime) && liveData.anime.length >= (db as any).anime.length) {
          (db as any).anime = liveData.anime;
        }
      } catch (err: any) {
        console.warn('[OngoingSyncService] Could not preload live_data.json:', err.message);
      }
    }

    try {
      const ongoingList = await getOngoingAnime();
      const allAnime = db.getAnimeList();
      const updates: SyncUpdateItem[] = [];

      for (const ongoingItem of ongoingList) {
        try {
          // 1. Fuzzy & Alias Matching
          const normTitle = ongoingItem.title.toLowerCase().replace(/[^a-z0-9]/g, ' ');
          const matchedAnime = allAnime.find(a => {
            const normA = a.canonicalTitle.toLowerCase().replace(/[^a-z0-9]/g, ' ');
            if (normA === normTitle || normA.includes(normTitle) || normTitle.includes(normA)) return true;
            for (const al of a.aliases || []) {
              const normAl = al.title.toLowerCase().replace(/[^a-z0-9]/g, ' ');
              if (normAl.length > 5 && (normTitle.includes(normAl) || normAl.includes(normTitle))) return true;
            }
            return false;
          });

          if (!matchedAnime) {
            continue;
          }

          // 2. Check current episodes in database
          const existingEps = db.getEpisodesByAnimeId(matchedAnime.id);
          const existingEpNumbers = new Set(existingEps.map(e => e.ordinal));
          const currentMaxEp = existingEps.length > 0 ? Math.max(...existingEps.map(e => e.ordinal)) : 0;

          // Extract remote episode number from latestEpisode string (e.g., "Episode 4")
          const epMatch = ongoingItem.latestEpisode.match(/Episode\s*(\d+)/i);
          const remoteEpNumber = epMatch ? parseInt(epMatch[1]) : 0;

          if (remoteEpNumber <= currentMaxEp && existingEpNumbers.has(remoteEpNumber)) {
            // Already up to date
            continue;
          }

          console.log(`[OngoingSyncService] New update found for ${matchedAnime.canonicalTitle}: Remote has Episode ${remoteEpNumber}, DB has Episode ${currentMaxEp}`);

          // 3. Fetch anime episode list details from source
          const details = await getAnimeDetails(ongoingItem.url);
          if (!details.episodes || details.episodes.length === 0) continue;

          for (const epInfo of details.episodes) {
            const epNumMatch = epInfo.title.match(/Episode\s*(\d+)/i);
            const epNum = epNumMatch ? parseInt(epNumMatch[1]) : 1;

            if (existingEpNumbers.has(epNum)) {
              continue; // Episode already exists in our database
            }

            console.log(`[OngoingSyncService] Ingesting new Episode ${epNum} for ${matchedAnime.canonicalTitle}...`);

            // 4. Resolve streams for this new episode
            const streamInfo: any = await getEpisodeStreams(epInfo.url, { resolveAllMirrors: true });
            const resolvedList: any[] = (streamInfo.resolvedStreams || []).filter(
              (s: any) => s.iframeSrc && !s.iframeSrc.includes('/maintenance')
            );

            const displayNumber = epNum < 10 ? `0${epNum}` : `${epNum}`;
            const isAoT = matchedAnime.id.startsWith('anime-aot-');
            const episodeId = isAoT
              ? `ep-${matchedAnime.id.replace('anime-', '')}-${epNum}`
              : (matchedAnime.id.startsWith('anime-')
                  ? `ep-${matchedAnime.id.slice(6)}-${epNum}`
                  : `ep-${matchedAnime.id}-${epNum}`);

            const newEpisode: Episode = {
              id: episodeId,
              animeId: matchedAnime.id,
              ordinal: epNum,
              displayNumber,
              episodeType: 'standard',
              title: epInfo.title || `${matchedAnime.canonicalTitle} Episode ${displayNumber}`,
              durationMinutes: 24,
              publishState: 'published',
              airedAt: new Date().toISOString(),
              airingState: 'aired',
              subtitleState: 'available',
              watchabilityState: 'eligible_verified',
            };

            // 5. Generate Multi-Source Stream Variants
            const newVariants: StreamVariant[] = [];
            const providersUsed: string[] = [];

            // A. Mega Cloud Player
            const megaStream: any = resolvedList.find((s: any) => s.canEmbedDirectly && s.iframeSrc?.includes('mega.nz'));
            if (megaStream) {
              newVariants.push({
                id: `var-${episodeId}-mega-720`,
                episodeId,
                providerId: 'prov-mega',
                providerName: 'Mega Cloud Player',
                qualityLabel: '720p',
                sourceRef: `${matchedAnime.id}-ep-${epNum}-mega-720`,
                embedUrl: megaStream.iframeSrc,
                audioLocale: 'ja-JP',
                subtitleLocale: 'id-ID',
                priority: 15,
                verificationState: 'verified',
                moderationState: 'approved',
                lastCheckedAt: timestamp,
              });
              providersUsed.push('Mega');
            }

            // B. Vidhide High-Speed
            const vidhideStream: any = resolvedList.find((s: any) => s.canEmbedDirectly && (s.iframeSrc?.includes('vidhide') || s.iframeSrc?.includes('odvidhide')));
            if (vidhideStream) {
              newVariants.push({
                id: `var-${episodeId}-vidhide-720`,
                episodeId,
                providerId: 'prov-vidhide',
                providerName: 'Vidhide High-Speed',
                qualityLabel: '720p',
                sourceRef: `${matchedAnime.id}-ep-${epNum}-vidhide`,
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
                id: `var-${episodeId}-desu-480`,
                episodeId,
                providerId: 'prov-desu',
                providerName: 'DesuStream Fast CDN',
                qualityLabel: '480p',
                sourceRef: `${matchedAnime.id}-ep-${epNum}-desu-480`,
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

            // D. In-App Failover Direct Cloud (Server Alpha 720p & Server Beta 1080p)
            newVariants.push({
              id: `var-${episodeId}-alpha-720`,
              episodeId,
              providerId: 'prov-alpha',
              providerName: 'Server Alpha (Direct Cloud)',
              qualityLabel: '720p',
              sourceRef: `${matchedAnime.id}-ep-${epNum}-alpha-720p`,
              embedUrl: `/embed/player?title=${encodeURIComponent(matchedAnime.canonicalTitle)}&ep=${epNum}&server=Server%20Alpha&quality=720p`,
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
              sourceRef: `${matchedAnime.id}-ep-${epNum}-beta-1080p`,
              embedUrl: `/embed/player?title=${encodeURIComponent(matchedAnime.canonicalTitle)}&ep=${epNum}&server=Server%20Beta&quality=1080p`,
              audioLocale: 'ja-JP',
              subtitleLocale: 'id-ID',
              priority: 14,
              verificationState: 'verified',
              moderationState: 'approved',
              lastCheckedAt: timestamp,
            });
            providersUsed.push('Server Beta');

            if (!options.dryRun) {
              // 6. Append to database (in-memory db & live_data.json)
              (db as any).episodes.push(newEpisode);
              for (const v of newVariants) {
                (db as any).variants.push(v);
              }

              // Update anime canonical episodes count
              if (!matchedAnime.totalCanonicalEpisodes || matchedAnime.totalCanonicalEpisodes < epNum) {
                matchedAnime.totalCanonicalEpisodes = epNum;
              }

              // Update season verified count
              const season = db.getSeasonByAnimeId(matchedAnime.id);
              if (season) {
                season.verifiedEpisodesCount = Math.max(season.verifiedEpisodesCount, epNum);
                season.airedEpisodesCount = Math.max(season.airedEpisodesCount, epNum);
              }

              db.addAuditLog(
                'pipeline-ongoing-sync',
                'Ongoing Auto-Sync Cron',
                'AUTO_INGEST_EPISODE',
                `Anime: ${matchedAnime.id} (Ep ${epNum})`,
                `Otomatis menambahkan episode ${epNum} dengan ${newVariants.length} multi-provider stream variants.`
              );
            }

            existingEpNumbers.add(epNum);

            updates.push({
              animeId: matchedAnime.id,
              animeTitle: matchedAnime.canonicalTitle,
              episodeNumber: epNum,
              displayNumber,
              episodeTitle: newEpisode.title,
              sourceUrl: epInfo.url,
              variantsAdded: newVariants.length,
              providers: providersUsed,
            });
          }
        } catch (animeErr: any) {
          console.error(`[OngoingSyncService] Error checking ongoing title "${ongoingItem.title}":`, animeErr.message);
        }
      }

      // 7. Persist to live_data.json if updates were made
      if (!options.dryRun && updates.length > 0 && fs.existsSync(LIVE_DATA_PATH)) {
        try {
          const liveData = JSON.parse(fs.readFileSync(LIVE_DATA_PATH, 'utf8'));
          liveData.episodes = (db as any).episodes;
          liveData.variants = (db as any).variants;
          liveData.anime = (db as any).anime;
          fs.writeFileSync(LIVE_DATA_PATH, JSON.stringify(liveData, null, 2), 'utf8');
          console.log(`[OngoingSyncService] Successfully persisted ${updates.length} new episodes to ${LIVE_DATA_PATH}`);
        } catch (persistErr: any) {
          console.error('[OngoingSyncService] Failed to persist to live_data.json:', persistErr.message);
        }
      }

      const report: OngoingSyncReport = {
        timestamp,
        status: updates.length > 0 ? 'success' : 'no_updates',
        checkedAnimeCount: ongoingList.length,
        newEpisodesCount: updates.length,
        updates,
        message: updates.length > 0
          ? `Pipeline berkala berhasil: Menemukan dan memperbarui ${updates.length} episode baru dari ${ongoingList.length} anime ongoing.`
          : `Pipeline berkala selesai: Seluruh ${ongoingList.length} anime ongoing sudah terupdate ke episode terbaru.`,
      };

      console.log(`[OngoingSyncService] Finished sync: ${report.message}`);
      return report;
    } catch (err: any) {
      console.error('[OngoingSyncService] Fatal error running ongoing sync:', err);
      return {
        timestamp,
        status: 'error',
        checkedAnimeCount: 0,
        newEpisodesCount: 0,
        updates: [],
        message: `Terjadi kendala saat menjalankan pipeline sync ongoing: ${err.message}`,
      };
    }
  }
}
