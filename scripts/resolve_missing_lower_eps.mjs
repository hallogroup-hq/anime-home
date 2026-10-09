import fs from 'fs';
import path from 'path';
import { getEpisodeStreams } from '../src/lib/services/otakudesuScraper.mjs';

const CACHE_FILE = path.resolve('scripts/base_catalog_streams.json');

const TARGETS = [
  // Dungeon Meshi eps 1 to 4
  { animeId: 'anime-dungeon', epNum: 1, url: 'https://otakudesu.blog/episode/dgnmshi-episode-1-sub-indo/' },
  { animeId: 'anime-dungeon', epNum: 2, url: 'https://otakudesu.blog/episode/dgnmshi-episode-2-sub-indo/' },
  { animeId: 'anime-dungeon', epNum: 3, url: 'https://otakudesu.blog/episode/dgnmshi-episode-3-sub-indo/' },
  { animeId: 'anime-dungeon', epNum: 4, url: 'https://otakudesu.blog/episode/dgnmshi-episode-4-sub-indo/' },
  // Wind Breaker ep 1
  { animeId: 'anime-windbreaker', epNum: 1, url: 'https://otakudesu.blog/episode/wdbrkr-episode-1-sub-indo/' },
  // Oshi no Ko Season 2 ep 1
  { animeId: 'anime-oshinoko', epNum: 1, url: 'https://otakudesu.blog/episode/onk-s2-episode-1-sub-indo/' },
  // Jujutsu Kaisen Season 2 ep 1
  { animeId: 'anime-jujutsu', epNum: 1, url: 'https://otakudesu.blog/episode/jts-ksn-s2-episode-1-sub-indo/' },
  // Tsukimichi eps 5, 7, 9
  { animeId: 'anime-tsukimichi', epNum: 5, url: 'https://otakudesu.blog/episode/tgmid-s2-episode-5-sub-indo/' },
  { animeId: 'anime-tsukimichi', epNum: 7, url: 'https://otakudesu.blog/episode/tgmid-s2-episode-7-sub-indo/' },
  { animeId: 'anime-tsukimichi', epNum: 9, url: 'https://otakudesu.blog/episode/tgmid-s2-episode-9-sub-indo/' },
];

async function main() {
  console.log('🚀 Resolving missing lower-numbered episodes...');

  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  }

  for (let i = 0; i < TARGETS.length; i++) {
    const t = TARGETS[i];
    console.log(`[${i + 1}/${TARGETS.length}] Resolving ${t.animeId} Ep ${t.epNum} (${t.url})...`);

    if (!cache[t.animeId]) {
      cache[t.animeId] = { episodes: {} };
    }

    try {
      const streamData = await getEpisodeStreams(t.url, { resolveAllMirrors: true });
      const validStreams = (streamData.resolvedStreams || []).filter(
        s => s.canEmbedDirectly && (s.server === 'mega' || s.server === 'vidhide' || s.server === 'filelions')
      );

      cache[t.animeId].episodes[t.url] = {
        title: `Episode ${t.epNum}`,
        url: t.url,
        resolvedStreams: validStreams,
        updatedAt: new Date().toISOString(),
      };

      console.log(`   ✅ Resolved ${validStreams.length} direct embed streams.`);
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (err) {
      console.error(`   ❌ Failed to resolve ${t.url}:`, err.message);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log('🎉 Done resolving missing lower episodes!');
}

main().catch(console.error);
