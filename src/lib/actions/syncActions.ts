'use server';

import { dbOrm } from '@/lib/db';
import { 
  anime as animeTable, 
  episodes as episodesTable, 
  streamVariants as streamVariantsTable, 
  providers as providersTable,
  animeTitles as animeTitlesTable,
  merchandise as merchandiseTable
} from '@/lib/db/schema';
import { requireRole } from './authActions';
import { db } from '@/lib/services/store';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

export async function syncAllToDatabaseAction() {
  await requireRole(['owner', 'admin']);

  const snapshot = db.exportDataSnapshot();

  // 1. Write to local JSON disk file for zero-loss server restart safety
  try {
    const dataDir = path.join(process.cwd(), 'src/lib/data');
    if (fs.existsSync(dataDir)) {
      const livePath = path.join(dataDir, 'live_data.json');
      fs.writeFileSync(livePath, JSON.stringify(snapshot, null, 2), 'utf-8');
    }
  } catch (fsErr) {
    console.warn('Could not write live_data.json to disk:', fsErr);
  }

  // 2. Sync to PostgreSQL if connected
  if (!dbOrm) {
    return {
      success: true,
      message: 'Data tersimpan di In-Memory Store & Disk Cache (PostgreSQL offline atau tidak terkonfigurasi).',
      counts: {
        anime: snapshot.anime.length,
        episodes: snapshot.episodes.length,
        variants: snapshot.variants.length,
      }
    };
  }

  try {
    // 1. Providers
    for (const p of snapshot.providers) {
      await dbOrm.insert(providersTable).values({
        id: p.id,
        name: p.name,
        domain: p.domain,
        providerType: p.providerType,
        apiAdapterKey: p.apiAdapterKey,
        status: p.status,
        termsUrl: p.termsUrl || null,
      }).onConflictDoUpdate({
        target: providersTable.id,
        set: {
          name: p.name,
          domain: p.domain,
          providerType: p.providerType,
          status: p.status,
        }
      });
    }

    // 2. Anime & Titles
    for (const a of snapshot.anime) {
      await dbOrm.insert(animeTable).values({
        id: a.id,
        canonicalTitle: a.canonicalTitle,
        slug: a.slug,
        mediaType: a.mediaType,
        synopsis: a.synopsis,
        firstAirDate: a.firstAirDate,
        year: a.year,
        seasonPeriod: a.seasonPeriod,
        maturityRating: a.maturityRating || 'PG-13',
        airingStatus: a.airingStatus,
        publishState: a.publishState,
        posterUrl: a.posterUrl,
        bannerUrl: a.bannerUrl,
        genres: JSON.stringify(a.genres),
      }).onConflictDoUpdate({
        target: animeTable.id,
        set: {
          canonicalTitle: a.canonicalTitle,
          slug: a.slug,
          mediaType: a.mediaType,
          synopsis: a.synopsis,
          year: a.year,
          seasonPeriod: a.seasonPeriod,
          maturityRating: a.maturityRating || 'PG-13',
          airingStatus: a.airingStatus,
          publishState: a.publishState,
          posterUrl: a.posterUrl,
          bannerUrl: a.bannerUrl,
          genres: JSON.stringify(a.genres),
        }
      });

      if (a.aliases) {
        for (const alt of a.aliases) {
          await dbOrm.insert(animeTitlesTable).values({
            id: alt.id,
            animeId: a.id,
            locale: alt.locale,
            title: alt.title,
            titleType: alt.titleType,
            normalizedTitle: alt.normalizedTitle,
          }).onConflictDoNothing();
        }
      }
    }

    // 3. Episodes
    for (const ep of snapshot.episodes) {
      await dbOrm.insert(episodesTable).values({
        id: ep.id,
        animeId: ep.animeId,
        ordinal: ep.ordinal,
        displayNumber: ep.displayNumber,
        episodeType: ep.episodeType,
        title: ep.title,
        durationMinutes: ep.durationMinutes,
        publishState: ep.publishState,
        airingState: ep.airingState,
        subtitleState: ep.subtitleState,
        watchabilityState: ep.watchabilityState,
        airedAt: ep.airedAt ? new Date(ep.airedAt) : null,
      }).onConflictDoUpdate({
        target: episodesTable.id,
        set: {
          title: ep.title,
          displayNumber: ep.displayNumber,
          ordinal: ep.ordinal,
          publishState: ep.publishState,
          airingState: ep.airingState,
          subtitleState: ep.subtitleState,
          watchabilityState: ep.watchabilityState,
        }
      });
    }

    // 4. Stream Variants
    for (const v of snapshot.variants) {
      await dbOrm.insert(streamVariantsTable).values({
        id: v.id,
        episodeId: v.episodeId,
        providerId: v.providerId,
        providerName: v.providerName,
        qualityLabel: v.qualityLabel,
        sourceRef: v.sourceRef,
        embedUrl: v.embedUrl,
        audioLocale: v.audioLocale,
        subtitleLocale: v.subtitleLocale,
        priority: v.priority,
        verificationState: v.verificationState,
        moderationState: v.moderationState,
        lastCheckedAt: v.lastCheckedAt ? new Date(v.lastCheckedAt) : null,
      }).onConflictDoUpdate({
        target: streamVariantsTable.id,
        set: {
          providerName: v.providerName,
          qualityLabel: v.qualityLabel,
          sourceRef: v.sourceRef,
          embedUrl: v.embedUrl,
          priority: v.priority,
          verificationState: v.verificationState,
          moderationState: v.moderationState,
        }
      });
    }

    // Revalidate paths
    revalidatePath('/');
    revalidatePath('/anime');
    revalidatePath('/schedule');
    revalidatePath('/watch/[episodeId]', 'page');
    revalidatePath('/admin');
    revalidatePath('/admin/matrix');
    revalidatePath('/admin/content');

    return {
      success: true,
      message: `Berhasil menyinkronkan ${snapshot.anime.length} anime, ${snapshot.episodes.length} episode, dan ${snapshot.variants.length} server streaming ke PostgreSQL!`,
      counts: {
        anime: snapshot.anime.length,
        episodes: snapshot.episodes.length,
        variants: snapshot.variants.length,
      }
    };
  } catch (err: any) {
    console.error('Error during PostgreSQL sync:', err);
    throw new Error(`Gagal menyinkronkan ke database: ${err.message}`);
  }
}
