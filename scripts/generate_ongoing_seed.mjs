import fs from 'fs/promises';

function cleanSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function mapQuality(q) {
  if (!q) return '720p';
  const clean = q.toLowerCase();
  if (clean.includes('1080')) return '1080p';
  if (clean.includes('720')) return '720p';
  if (clean.includes('480')) return '480p';
  if (clean.includes('360')) return '360p';
  return '720p';
}

function mapProvider(server) {
  const s = (server || '').toLowerCase();
  if (s.includes('mega')) return { id: 'prov-mega', name: 'Mega Cloud Player' };
  if (s.includes('vidhide')) return { id: 'prov-vidhide', name: 'Vidhide Stream' };
  if (s.includes('filedon')) return { id: 'prov-filedon', name: 'Filedon Cloud' };
  return { id: 'prov-desustream', name: 'Desustream CDN' };
}

async function run() {
  const raw = await fs.readFile('scripts/scraped_ongoing_cache.json', 'utf8');
  const items = JSON.parse(raw);

  const animeList = [];
  const episodesList = [];
  const variantsList = [];
  const seasonsList = [];

  const providers = [
    {
      id: 'prov-mega',
      name: 'Mega Cloud Player',
      domain: 'mega.nz',
      providerType: 'embed',
      apiAdapterKey: 'custom_embed',
      status: 'active',
      termsUrl: 'https://mega.nz/terms',
    },
    {
      id: 'prov-vidhide',
      name: 'Vidhide Stream',
      domain: 'odvidhide.com',
      providerType: 'embed',
      apiAdapterKey: 'custom_embed',
      status: 'active',
      termsUrl: 'https://odvidhide.com',
    },
    {
      id: 'prov-desustream',
      name: 'Desustream CDN',
      domain: 'desustream.net',
      providerType: 'embed',
      apiAdapterKey: 'custom_embed',
      status: 'active',
      termsUrl: 'https://desustream.net',
    },
    {
      id: 'prov-filedon',
      name: 'Filedon Cloud',
      domain: 'filedon.co',
      providerType: 'embed',
      apiAdapterKey: 'custom_embed',
      status: 'active',
      termsUrl: 'https://filedon.co',
    },
  ];

  for (const item of items) {
    const slug = cleanSlug(item.title);
    const animeId = `anime-otk-${slug}`;

    const aliases = [];
    if (item.japaneseTitle) {
      aliases.push({
        id: `t-otk-${slug}-ja`,
        animeId,
        locale: 'ja-JP',
        title: item.japaneseTitle,
        titleType: 'japanese',
        normalizedTitle: item.japaneseTitle.toLowerCase(),
      });
    }
    aliases.push({
      id: `t-otk-${slug}-en`,
      animeId,
      locale: 'en-US',
      title: item.title,
      titleType: 'english',
      normalizedTitle: item.title.toLowerCase(),
    });

    const parsedYear = item.releaseDate && item.releaseDate.match(/\b(19\d\d|20\d\d)\b/)
      ? parseInt(item.releaseDate.match(/\b(19\d\d|20\d\d)\b/)[1], 10)
      : 2026;

    const totalEp = item.episodes?.length || 12;

    const animeObj = {
      id: animeId,
      canonicalTitle: item.title,
      slug: `otk-${slug}`,
      mediaType: item.type === 'Movie' ? 'Movie' : 'TV',
      synopsis: item.synopsis || `Serial anime ${item.title} subtitle Indonesia tayang setiap minggu di ANIME HOME.`,
      firstAirDate: item.releaseDate || '2026-10-01',
      year: parsedYear,
      seasonPeriod: 'Fall',
      maturityRating: 'PG-13',
      airingStatus: 'airing',
      publishState: 'published',
      posterUrl: item.posterUrl || 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-U1v5w63g7Lsm.png',
      bannerUrl: item.posterUrl || 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/171018-b2k20bH64XbV.jpg',
      genres: item.genres?.length ? item.genres : ['Action', 'Fantasy'],
      aliases,
      seasonReadinessState: 'READY_ONGOING',
      totalCanonicalEpisodes: totalEp,
      scheduleWIB: `${item.releaseDay || 'Minggu'}, 20:00 WIB`,
      officialPlatformName: 'Otakudesu Network',
      externalFreeWatchUrl: item.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    animeList.push(animeObj);

    // Create episodes
    const eps = item.episodes || [];
    // We can add all episodes or up to the most recent 12 episodes to keep size reasonable
    const episodesToIngest = eps.slice(0, Math.min(eps.length, 24));

    for (let idx = 0; idx < episodesToIngest.length; idx++) {
      const epData = episodesToIngest[idx];
      const ordinal = eps.length - idx; // top is latest
      const displayNumber = ordinal < 10 ? `0${ordinal}` : `${ordinal}`;
      const episodeId = `ep-otk-${slug}-${ordinal}`;

      const episodeObj = {
        id: episodeId,
        animeId,
        ordinal,
        displayNumber,
        episodeType: 'standard',
        title: epData.title.replace(/Subtitle Indonesia.*/i, '').trim() || `Episode ${displayNumber}`,
        durationMinutes: 24,
        publishState: 'published',
        airedAt: new Date().toISOString(),
        airingState: 'aired',
        subtitleState: 'available',
        watchabilityState: 'eligible_verified',
      };

      episodesList.push(episodeObj);

      // If this is the latest episode, add resolved stream variants!
      if (idx === 0 && item.topEpisodeStreams?.resolvedStreams?.length > 0) {
        let variantIndex = 0;
        for (const s of item.topEpisodeStreams.resolvedStreams) {
          if (!s.iframeSrc) continue;
          const quality = mapQuality(s.quality);
          const prov = mapProvider(s.server);
          const priority = s.canEmbedDirectly ? (s.server.includes('mega') ? 12 : 10) : 5;

          const variantObj = {
            id: `var-otk-${slug}-${ordinal}-${variantIndex++}`,
            episodeId,
            providerId: prov.id,
            providerName: prov.name,
            qualityLabel: quality,
            sourceRef: `otk-${slug}-${ordinal}-${s.server}-${quality}`,
            embedUrl: s.iframeSrc,
            audioLocale: 'ja-JP',
            subtitleLocale: 'id-ID',
            priority,
            verificationState: 'verified',
            moderationState: 'approved',
            lastCheckedAt: new Date().toISOString(),
          };

          variantsList.push(variantObj);
        }
      }
    }

    // Season object
    const seasonObj = {
      id: `season-otk-${slug}-1`,
      animeId,
      seasonNumber: 1,
      title: `${item.title} Musim Penayangan 2026`,
      year: parsedYear,
      seasonPeriod: 'Fall',
      canonicalEpisodesCount: totalEp,
      airedEpisodesCount: episodesToIngest.length,
      verifiedEpisodesCount: item.topEpisodeStreams?.resolvedStreams?.length ? 1 : 0,
      missingEpisodes: [],
      readinessState: 'READY_ONGOING',
      licenseType: 'free_embed',
      officialPlatformName: 'Otakudesu Network',
      externalFreeWatchUrl: item.url,
      notes: `Tayang aktif (Ongoing) dengan takarir Indonesia dan pemutar video multi-server.`,
      updatedAt: new Date().toISOString(),
    };

    seasonsList.push(seasonObj);
  }

  const fileContent = `// Auto-generated ongoing anime seed data from Otakudesu Network
import { Anime, Episode, StreamVariant, Season, Provider } from '@/types';

export const ONGOING_PROVIDERS: Provider[] = ${JSON.stringify(providers, null, 2)};

export const ONGOING_ANIME: Anime[] = ${JSON.stringify(animeList, null, 2)};

export const ONGOING_EPISODES: Episode[] = ${JSON.stringify(episodesList, null, 2)};

export const ONGOING_STREAM_VARIANTS: StreamVariant[] = ${JSON.stringify(variantsList, null, 2)};

export const ONGOING_SEASONS: Season[] = ${JSON.stringify(seasonsList, null, 2)};
`;

  await fs.writeFile('src/lib/data/ongoingSeed.ts', fileContent, 'utf8');
  console.log(`Generated src/lib/data/ongoingSeed.ts:`);
  console.log(`- Anime: ${animeList.length}`);
  console.log(`- Episodes: ${episodesList.length}`);
  console.log(`- Stream Variants: ${variantsList.length}`);
  console.log(`- Seasons: ${seasonsList.length}`);
}

run().catch(console.error);
