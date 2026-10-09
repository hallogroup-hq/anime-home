import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { dbOrm } from '../src/lib/db';
import { 
  anime as animeTable, 
  episodes as episodesTable, 
  streamVariants as streamVariantsTable, 
  providers as providersTable,
  animeTitles as animeTitlesTable,
  merchandise as merchandiseTable
} from '../src/lib/db/schema';
import { 
  ONGOING_PROVIDERS, 
  ONGOING_ANIME, 
  ONGOING_EPISODES, 
  ONGOING_STREAM_VARIANTS 
} from '../src/lib/data/ongoingSeed';
import {
  INITIAL_ANIME,
  INITIAL_MERCH_ITEMS
} from '../src/lib/data/seed';
import { sql, eq } from 'drizzle-orm';

async function syncToPostgres() {
  if (!dbOrm) {
    console.log('ℹ️ DATABASE_URL is not set or dbOrm is null. Skipping PostgreSQL sync.');
    return;
  }

  console.log('🔄 Syncing anime, streams, and merchandise to PostgreSQL...');

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

  // 2. Anime (Catalog & Ongoing)
  console.log('2. Inserting catalog & ongoing anime...');
  const allAnime = [...INITIAL_ANIME, ...ONGOING_ANIME];
  for (const a of allAnime) {
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

  // 3. Clean up and insert fresh ongoing episodes & stream variants
  console.log('3. Refreshing ongoing episodes & stream variants...');
  for (const a of ONGOING_ANIME) {
    const oldEps = await dbOrm.select({ id: episodesTable.id }).from(episodesTable).where(eq(episodesTable.animeId, a.id));
    for (const e of oldEps) {
      await dbOrm.delete(streamVariantsTable).where(eq(streamVariantsTable.episodeId, e.id));
    }
    await dbOrm.delete(episodesTable).where(eq(episodesTable.animeId, a.id));
  }

  console.log('Inserting episodes...');
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
  console.log('4. Inserting unique stream variants...');
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

  // 5. Authentic Merchandise
  console.log('5. Inserting authentic merchandise...');
  await dbOrm.delete(merchandiseTable);
  for (const m of INITIAL_MERCH_ITEMS) {
    await dbOrm.insert(merchandiseTable).values({
      id: m.id,
      animeId: m.animeId,
      animeTitle: m.animeTitle,
      name: m.name,
      price: m.price,
      storeName: m.storeName,
      destinationUrl: m.destinationUrl,
      imageUrl: m.imageUrl,
      isAffiliate: m.isAffiliate,
    });
  }

  console.log(`✅ PostgreSQL sync complete! (Synced ${INITIAL_MERCH_ITEMS.length} merchandise items)`);
  process.exit(0);
}

syncToPostgres().catch(err => {
  console.error('Error syncing to Postgres:', err);
  process.exit(1);
});
