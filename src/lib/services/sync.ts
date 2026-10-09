import { db } from '@/lib/services/store';
import { SeasonVerificationResult } from './seasonVerification';

export interface SyncAuditReport {
  timestamp: string;
  airedEpisodesUpdated: number;
  totalSeasonsAudited: number;
  seasonReadinessSummary: Record<string, number>;
  verifiedPlayableTitles: string[];
  restrictedTitles: string[];
  upcomingTitles: string[];
}

export class FreshnessSyncService {
  /**
   * Mengaudit jadwal penayangan (WIB) dan memperbarui status episode yang telah mengudara
   */
  public static auditBroadcastSchedules(currentTime = new Date()): {
    updatedCount: number;
    updatedEpisodes: { animeTitle: string; episodeNumber: string; oldState: string; newState: string }[];
  } {
    const allEpisodes = db.getAllEpisodes();
    const updatedEpisodes: { animeTitle: string; episodeNumber: string; oldState: string; newState: string }[] = [];

    for (const ep of allEpisodes) {
      if (ep.airingState === 'scheduled' && ep.airedAt) {
        const airDate = new Date(ep.airedAt);
        if (airDate.getTime() <= currentTime.getTime()) {
          const anime = db.getAnimeList().find(a => a.id === ep.animeId);
          // Update status episode menjadi 'aired' dengan status subtitle awal 'pending'
          ep.airingState = 'aired';
          if (ep.subtitleState === 'not_available') {
            ep.subtitleState = 'pending';
          }
          updatedEpisodes.push({
            animeTitle: anime?.canonicalTitle || ep.animeId,
            episodeNumber: ep.displayNumber,
            oldState: 'scheduled',
            newState: 'aired',
          });
        }
      }
    }

    return {
      updatedCount: updatedEpisodes.length,
      updatedEpisodes,
    };
  }

  /**
   * Menghasilkan laporan audit sinkronisasi ketersediaan seluruh katalog anime
   */
  public static runFullCatalogAudit(): SyncAuditReport {
    const scheduleAudit = this.auditBroadcastSchedules();
    const seasonVerifications = db.getAllSeasonVerifications();

    const seasonReadinessSummary: Record<string, number> = {
      READY_COMPLETE: 0,
      READY_ONGOING: 0,
      INCOMPLETE: 0,
      AWAITING_EPISODE: 0,
      SOURCE_UNVERIFIED: 0,
      UNAVAILABLE: 0,
    };

    const verifiedPlayableTitles: string[] = [];
    const restrictedTitles: string[] = [];
    const upcomingTitles: string[] = [];

    const animeList = db.getAnimeList();

    for (const v of seasonVerifications) {
      seasonReadinessSummary[v.readinessState] = (seasonReadinessSummary[v.readinessState] || 0) + 1;
      const anime = animeList.find(a => a.id === v.animeId);
      const title = anime?.canonicalTitle || v.animeId;

      if (v.readinessState === 'READY_COMPLETE' || v.readinessState === 'READY_ONGOING' || v.hasPlayableStreams) {
        verifiedPlayableTitles.push(`${title} (${v.verifiedEpisodesCount}/${v.canonicalEpisodesCount} ep)`);
      } else if (v.readinessState === 'AWAITING_EPISODE') {
        upcomingTitles.push(title);
      } else {
        restrictedTitles.push(title);
      }
    }

    return {
      timestamp: new Date().toISOString(),
      airedEpisodesUpdated: scheduleAudit.updatedCount,
      totalSeasonsAudited: seasonVerifications.length,
      seasonReadinessSummary,
      verifiedPlayableTitles,
      restrictedTitles,
      upcomingTitles,
    };
  }
}
