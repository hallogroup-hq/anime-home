import fs from 'fs';
import path from 'path';
import { getAnimeDetails, getEpisodeStreams } from '../src/lib/services/otakudesuScraper.mjs';

const CACHE_FILE = path.resolve('scripts/base_catalog_streams.json');

const TARGET_ANIME = [
  { animeId: 'anime-kaiju8', url: 'https://otakudesu.blog/anime/kaiju-gou-sub-indo/' },
  { animeId: 'anime-dungeon', url: 'https://otakudesu.blog/anime/dungeon-meshi-sub-indo/' },
  { animeId: 'anime-windbreaker', url: 'https://otakudesu.blog/anime/wind-break-sub-indo/' },
  { animeId: 'anime-oshinoko', url: 'https://otakudesu.blog/anime/oshi-ko-s2-sub-indo/' },
  { animeId: 'anime-mushoku', url: 'https://otakudesu.blog/anime/mushoku-tensi-s2-part-2-sub-indo/' },
  { animeId: 'anime-jujutsu', url: 'https://otakudesu.blog/anime/jjk-s2-sub-indo/' },
  { animeId: 'anime-shokugeki', url: 'https://otakudesu.blog/anime/shokugeki-no-souma-bd-subtitle-indonesia/' },
  { animeId: 'anime-tsukimichi', url: 'https://otakudesu.blog/anime/tsuki-michibiku-isekai-douchu-s2-sub-indo/' },
  { animeId: 'anime-oregairu', url: 'https://otakudesu.blog/anime/ogairu-subtitle-indonesia/' },
  { animeId: 'anime-onepunch', url: 'https://otakudesu.blog/anime/one-punch-sub-indo/' },
];

async function main() {
  console.log('🚀 Starting Resolution of Base Catalog Streams...');

  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch {}
  }

  for (const target of TARGET_ANIME) {
    console.log(`\n========================================`);
    console.log(`Fetching details for: ${target.animeId} (${target.url})`);
    let details;
    try {
      details = await getAnimeDetails(target.url);
      console.log(`Found ${details.episodes.length} episodes.`);
    } catch (err) {
      console.error(`Failed to fetch details for ${target.animeId}:`, err.message);
      continue;
    }

    if (!cache[target.animeId]) {
      cache[target.animeId] = {
        title: details.title,
        episodes: {},
      };
    }

    // Resolve up to 12 episodes per anime (or all for smaller ones)
    const episodesToResolve = details.episodes.slice(0, 12);
    for (let i = 0; i < episodesToResolve.length; i++) {
      const ep = episodesToResolve[i];
      if (cache[target.animeId].episodes[ep.url]?.resolvedStreams?.length > 0) {
        console.log(`  [${i + 1}/${episodesToResolve.length}] Already cached: ${ep.title}`);
        continue;
      }

      console.log(`  [${i + 1}/${episodesToResolve.length}] Resolving: ${ep.title} (${ep.url})...`);
      try {
        const streamData = await getEpisodeStreams(ep.url, { resolveAllMirrors: true });
        const validStreams = (streamData.resolvedStreams || []).filter(
          s => s.canEmbedDirectly && (s.server === 'mega' || s.server === 'vidhide' || s.server === 'filelions')
        );

        cache[target.animeId].episodes[ep.url] = {
          title: ep.title,
          url: ep.url,
          resolvedStreams: validStreams,
          updatedAt: new Date().toISOString(),
        };

        console.log(`    ✅ Resolved ${validStreams.length} direct embed streams.`);
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
      } catch (err) {
        console.error(`    ❌ Failed to resolve ${ep.url}:`, err.message);
      }

      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\n🎉 Resolution Complete! Saved to ${CACHE_FILE}`);
}

main().catch(console.error);
