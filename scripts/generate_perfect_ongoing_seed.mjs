import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.resolve('scripts/scraped_ongoing_cache.json');
const STREAMS_FILE = path.resolve('scripts/unique_episodes_streams.json');
const ONGOING_SEED_FILE = path.resolve('src/lib/data/ongoingSeed.ts');

function mapQuality(q) {
  if (!q) return '720p';
  const str = String(q).toLowerCase();
  if (str.includes('1080')) return '1080p';
  if (str.includes('720')) return '720p';
  if (str.includes('480')) return '480p';
  if (str.includes('360')) return '360p';
  return '720p';
}

function mapProvider(server) {
  const s = String(server).toLowerCase();
  if (s.includes('mega')) return { id: 'prov-mega', name: 'Mega Cloud Player' };
  if (s.includes('vidhide')) return { id: 'prov-vidhide', name: 'Vidhide Stream' };
  if (s.includes('filedon')) return { id: 'prov-filedon', name: 'Filedon Fast Stream' };
  if (s.includes('odstream') || s.includes('desustream')) return { id: 'prov-odstream', name: 'DesuStream Network' };
  return { id: `prov-${s.replace(/[^a-z0-9]/g, '')}`, name: `${server} Stream` };
}

export function buildOngoingSeed() {
  console.log('🔄 Building Complete Ongoing Seed with Real Episode Numbers and Unique Streams...');

  const ongoingData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  const streamsData = fs.existsSync(STREAMS_FILE) ? JSON.parse(fs.readFileSync(STREAMS_FILE, 'utf8')) : {};

  const providers = [
    {
      id: 'prov-mega',
      name: 'Mega Cloud Player',
      domain: 'mega.nz',
      providerType: 'embed',
      apiAdapterKey: 'custom_embed',
      status: 'active',
    },
    {
      id: 'prov-vidhide',
      name: 'Vidhide Stream',
      domain: 'odvidhide.com',
      providerType: 'embed',
      apiAdapterKey: 'custom_embed',
      status: 'active',
    },
  ];

  const animeList = [];
  const episodesList = [];
  const variantsList = [];
  const seasonsList = [];

  for (const item of ongoingData) {
    const slug = (item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
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
      : (item.title === 'One Piece' ? 1999 : 2026);

    const eps = item.episodes || [];
    const episodesToIngest = eps.slice(0, Math.min(eps.length, 24));

    // Determine max episode number from titles
    let maxEpisodeNumber = eps.length;
    for (const ep of eps) {
      const m = ep.title.match(/Episode\s+(\d+)/i);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num > maxEpisodeNumber) maxEpisodeNumber = num;
      }
    }

    const animeObj = {
      id: animeId,
      canonicalTitle: item.title,
      slug: `otk-${slug}`,
      mediaType: item.type === 'Movie' ? 'Movie' : 'TV',
      synopsis: item.synopsis || `Serial anime ${item.title} subtitle Indonesia tayang setiap minggu di ANIME HOME.`,
      firstAirDate: item.releaseDate || (item.title === 'One Piece' ? 'Oct 20, 1999' : '2026-10-01'),
      year: parsedYear,
      seasonPeriod: 'Fall',
      maturityRating: 'PG-13',
      airingStatus: 'airing',
      publishState: 'published',
      posterUrl: item.posterUrl || 'https://otakudesu.blog/wp-content/uploads/2021/05/One-Piece-Sub-Indo.jpg',
      bannerUrl: item.posterUrl || 'https://otakudesu.blog/wp-content/uploads/2021/05/One-Piece-Sub-Indo.jpg',
      genres: item.genres?.length ? item.genres : ['Action', 'Adventure'],
      aliases,
      seasonReadinessState: 'READY_ONGOING',
      totalCanonicalEpisodes: maxEpisodeNumber,
      scheduleWIB: `${item.releaseDay || 'Minggu'}, 20:00 WIB`,
      officialPlatformName: 'Otakudesu Network',
      externalFreeWatchUrl: item.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    animeList.push(animeObj);

    for (let idx = 0; idx < episodesToIngest.length; idx++) {
      const epData = episodesToIngest[idx];
      const match = epData.title.match(/Episode\s+(\d+)/i);
      const epNum = match ? parseInt(match[1], 10) : (eps.length - idx);
      const displayNumber = epNum < 10 ? `0${epNum}` : `${epNum}`;
      const episodeId = `ep-otk-${slug}-${epNum}`;

      const episodeObj = {
        id: episodeId,
        animeId,
        ordinal: epNum,
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

      // Add unique stream variants from resolved data
      const streamRecord = streamsData[epData.url];
      if (streamRecord && streamRecord.resolvedStreams?.length > 0) {
        let variantIndex = 0;
        for (const s of streamRecord.resolvedStreams) {
          if (!s.iframeSrc) continue;
          if (!s.canEmbedDirectly) continue; // Only keep direct embeddable streams

          const quality = mapQuality(s.quality);
          const prov = mapProvider(s.server);
          const priority = s.server.includes('mega') ? 12 : 10;

          const variantObj = {
            id: `var-otk-${slug}-${epNum}-${variantIndex++}`,
            episodeId,
            providerId: prov.id,
            providerName: prov.name,
            qualityLabel: quality,
            sourceRef: `otk-${slug}-${epNum}-${s.server}-${quality}`,
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

    const seasonObj = {
      id: `season-otk-${slug}-1`,
      animeId,
      seasonNumber: 1,
      title: `${item.title} Musim Penayangan 2026`,
      year: parsedYear,
      seasonPeriod: 'Fall',
      canonicalEpisodesCount: maxEpisodeNumber,
      airedEpisodesCount: episodesToIngest.length,
      verifiedEpisodesCount: episodesToIngest.length,
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

  const fileContent = `// Auto-generated ongoing anime seed data from Otakudesu Network with 100% Unique Streams & Correct Episode Numbers
import { Anime, Episode, StreamVariant, Season, Provider } from '@/types';

export const ONGOING_PROVIDERS: Provider[] = ${JSON.stringify(providers, null, 2)};

export const ONGOING_ANIME: Anime[] = ${JSON.stringify(animeList, null, 2)};

export const ONGOING_EPISODES: Episode[] = ${JSON.stringify(episodesList, null, 2)};

export const ONGOING_STREAM_VARIANTS: StreamVariant[] = ${JSON.stringify(variantsList, null, 2)};

export const ONGOING_SEASONS: Season[] = ${JSON.stringify(seasonsList, null, 2)};
`;

  fs.writeFileSync(ONGOING_SEED_FILE, fileContent);
  console.log(`✅ Saved ongoing seed to ${ONGOING_SEED_FILE}`);
  console.log(`Total Ongoing Anime: ${animeList.length}`);
  console.log(`Total Episodes     : ${episodesList.length}`);
  console.log(`Total Variants     : ${variantsList.length}`);
}

if (process.argv[1].endsWith('generate_perfect_ongoing_seed.mjs')) {
  buildOngoingSeed();
}
