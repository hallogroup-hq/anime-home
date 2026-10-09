import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { dbOrm } from '../src/lib/db';
import { 
  anime as animeTable, 
  episodes as episodesTable, 
  streamVariants as streamVariantsTable, 
  providers as providersTable,
  animeTitles as animeTitlesTable 
} from '../src/lib/db/schema';
import { 
  ONGOING_PROVIDERS, 
  ONGOING_ANIME, 
  ONGOING_EPISODES, 
  ONGOING_STREAM_VARIANTS 
} from '../src/lib/data/ongoingSeed';
import { sql } from 'drizzle-orm';

async function syncToPostgres() {
  if (!dbOrm) {
    console.log('ℹ️ DATABASE_URL is not set or dbOrm is null. Skipping PostgreSQL sync.');
    return;
  }

  console.log('🔄 Syncing ongoing anime to PostgreSQL...');

  // 1. Providers
  console.log('1. Inserting providers...');
  for (const p of ONGOING_PROVIDERS) {
    await dbOrm.insert(providersTable).values({
      id: p.id,
      name: p.name,
      domain: p.domain,
      providerType: p.providerType,
      apiAdapterKey: p.apiAdapterKey,
      status: p.status,
      termsUrl: p.termsUrl || null,
    }).onConflictDoNothing();
  }

  // 2. Anime
  console.log('2. Inserting ongoing anime...');
  for (const a of ONGOING_ANIME) {
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
    }).onConflictDoNothing();

    // Titles
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
  console.log('3. Inserting episodes...');
  for (const ep of ONGOING_EPISODES) {
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
    }).onConflictDoNothing();
  }

  // 4. Stream Variants
  console.log('4. Inserting stream variants...');
  for (const v of ONGOING_STREAM_VARIANTS) {
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
    }).onConflictDoNothing();
  }

  console.log('✅ PostgreSQL sync complete!');
  process.exit(0);
}

syncToPostgres().catch(err => {
  console.error('Error syncing to Postgres:', err);
  process.exit(1);
});
