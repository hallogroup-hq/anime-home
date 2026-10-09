import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import {
  INITIAL_PROVIDERS,
  INITIAL_ANIME,
  INITIAL_EPISODES,
  INITIAL_STREAM_VARIANTS,
  INITIAL_MERCH_ITEMS,
  INITIAL_WATCH_ORDERS,
  INITIAL_CHARACTERS,
  INITIAL_COMMENTS,
  INITIAL_CAMPAIGNS,
} from '../data/seed';

async function runSeed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set!');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database:', url.replace(/:[^:@]*@/, ':****@'));
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  try {
    console.log('🌱 Seeding database...');

    // 1. Providers
    console.log('  -> Seeding providers...');
    for (const p of INITIAL_PROVIDERS) {
      await db.insert(schema.providers).values({
        id: p.id,
        name: p.name,
        domain: p.domain,
        providerType: p.providerType,
        apiAdapterKey: p.apiAdapterKey,
        status: p.status,
        termsUrl: p.termsUrl || null,
      }).onConflictDoNothing();
    }

    // 2. Anime & Titles
    console.log('  -> Seeding anime & titles...');
    for (const a of INITIAL_ANIME) {
      await db.insert(schema.anime).values({
        id: a.id,
        canonicalTitle: a.canonicalTitle,
        slug: a.slug,
        mediaType: a.mediaType,
        synopsis: a.synopsis,
        firstAirDate: a.firstAirDate || null,
        year: a.year,
        seasonPeriod: a.seasonPeriod,
        maturityRating: a.maturityRating,
        airingStatus: a.airingStatus,
        publishState: a.publishState,
        posterUrl: a.posterUrl,
        bannerUrl: a.bannerUrl,
        genres: JSON.stringify(a.genres),
      }).onConflictDoNothing();

      if (a.aliases && a.aliases.length > 0) {
        for (const alt of a.aliases) {
          await db.insert(schema.animeTitles).values({
            id: alt.id,
            animeId: alt.animeId,
            locale: alt.locale,
            title: alt.title,
            titleType: alt.titleType,
            normalizedTitle: alt.normalizedTitle,
          }).onConflictDoNothing();
        }
      }
    }

    // 3. Episodes
    console.log('  -> Seeding episodes...');
    for (const ep of INITIAL_EPISODES) {
      await db.insert(schema.episodes).values({
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
    console.log('  -> Seeding stream variants...');
    for (const v of INITIAL_STREAM_VARIANTS) {
      await db.insert(schema.streamVariants).values({
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
      }).onConflictDoNothing();
    }

    // 5. Characters & Seiyuu
    console.log('  -> Seeding characters...');
    for (const c of INITIAL_CHARACTERS) {
      await db.insert(schema.characters).values({
        id: c.id,
        animeId: c.animeId,
        name: c.name,
        japaneseName: (c as any).japaneseName || null,
        role: c.role,
        imageUrl: c.imageUrl,
        voiceActorName: c.voiceActorName,
        voiceActorLanguage: c.voiceActorLanguage,
      }).onConflictDoNothing();
    }

    // 6. Watch Orders
    console.log('  -> Seeding franchise watch orders...');
    const validAnimeIds = new Set(INITIAL_ANIME.map(a => a.id));
    for (const wo of INITIAL_WATCH_ORDERS) {
      await db.insert(schema.watchOrders).values({
        id: wo.id,
        franchiseId: wo.franchiseId,
        franchiseName: wo.franchiseName,
        animeId: (wo.animeId && validAnimeIds.has(wo.animeId)) ? wo.animeId : null,
        title: wo.title,
        slug: wo.slug || null,
        releaseYear: wo.year,
        releaseOrder: wo.orderNumber,
        chronologicalOrder: wo.orderNumber,
        type: wo.type,
        isCanon: (wo.canonStatus as string) !== 'Filler / Optional',
        note: wo.note || null,
      }).onConflictDoNothing();
    }

    // 7. Merchandise
    console.log('  -> Seeding merchandise...');
    for (const m of INITIAL_MERCH_ITEMS) {
      await db.insert(schema.merchandise).values({
        id: m.id,
        animeId: (m.animeId && validAnimeIds.has(m.animeId)) ? m.animeId : null,
        animeTitle: m.animeTitle,
        name: m.name,
        price: m.price,
        storeName: m.storeName,
        destinationUrl: m.destinationUrl,
        imageUrl: m.imageUrl,
        isAffiliate: m.isAffiliate,
      }).onConflictDoNothing();
    }

    // 8. Episode Comments
    console.log('  -> Seeding episode comments...');
    for (const cm of INITIAL_COMMENTS) {
      await db.insert(schema.comments).values({
        id: cm.id,
        episodeId: cm.episodeId,
        userId: `usr-${cm.id}`,
        username: (cm as any).authorName || (cm as any).username || 'Anonymous',
        avatarUrl: (cm as any).avatarUrl || 'https://s4.anilist.co/file/anilistcdn/character/large/b176754-PCnpqIOkjhFk.png',
        content: cm.content,
        isSpoiler: cm.isSpoiler,
        likesCount: (cm as any).likes || (cm as any).likesCount || 0,
        createdAt: new Date(cm.createdAt),
      }).onConflictDoNothing();
    }

    // 9. Homepage Visual CMS Config
    console.log('  -> Seeding homepage configs...');
    const defaultSections = [
      { id: 'hero', enabled: true, title: 'Hero Spotlight', order: 1 },
      { id: 'continue_watching', enabled: true, title: 'Lanjutkan Menonton', order: 2 },
      { id: 'latest_episodes', enabled: true, title: 'Episode Terbaru', order: 3 },
      { id: 'ad_banner', enabled: true, title: 'Banner Sponsor', order: 4 },
      { id: 'popular', enabled: true, title: 'Populer Musim Ini', order: 5 },
    ];
    await db.insert(schema.homepageConfigs).values({
      id: 'cfg-default',
      heroAnimeId: 'anime-frieren',
      sections: JSON.stringify(defaultSections),
    }).onConflictDoNothing();

    // 10. Ad Campaigns
    console.log('  -> Seeding ad campaigns...');
    for (const ad of INITIAL_CAMPAIGNS) {
      await db.insert(schema.adCampaigns).values({
        id: ad.id,
        slotKey: ad.slotKey,
        sponsorName: ad.sponsorName,
        bannerUrl: (ad as any).imageUrl || (ad as any).bannerUrl || '',
        targetUrl: (ad as any).destinationUrl || (ad as any).targetUrl || '',
        active: ad.status === 'active' || (ad as any).active === true,
      }).onConflictDoNothing();
    }

    // 11. User Profiles & RBAC
    console.log('  -> Seeding user profiles & RBAC accounts...');
    const defaultUsers = [
      {
        id: 'user-guest-01',
        email: 'guest@animehome.id',
        username: 'Tamu Anime Home',
        role: 'user',
        avatarUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b176754-PCnpqIOkjhFk.png',
        isLoggedIn: false,
      },
      {
        id: 'admin-owner-01',
        email: 'owner@animehome.id',
        username: 'Chief Executive Owner',
        role: 'owner',
        avatarUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b127691-9zqh1xpIubn7.png',
        isLoggedIn: true,
      },
      {
        id: 'admin-operator-01',
        email: 'operator@animehome.id',
        username: 'Streaming Operator',
        role: 'operator',
        avatarUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b126071-BTNEc1nRIv68.png',
        isLoggedIn: true,
      },
      {
        id: 'admin-editor-01',
        email: 'editor@animehome.id',
        username: 'Content Editor',
        role: 'editor',
        avatarUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b183965-uGFohBjlFoTp.png',
        isLoggedIn: true,
      },
      {
        id: 'admin-moderator-01',
        email: 'moderator@animehome.id',
        username: 'Community Moderator',
        role: 'moderator',
        avatarUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b127518-NRlq1CQ1v1ro.png',
        isLoggedIn: true,
      },
      {
        id: 'user-member-01',
        email: 'member@animehome.id',
        username: 'Akmal Otaku',
        role: 'user',
        avatarUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b127212-FVm2tD0erQ5B.png',
        isLoggedIn: true,
      },
    ];

    for (const u of defaultUsers) {
      await db.insert(schema.userProfiles).values(u).onConflictDoNothing();
    }

    console.log('✅ SEEDING COMPLETE! All relational data inserted successfully into PostgreSQL.');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runSeed();
