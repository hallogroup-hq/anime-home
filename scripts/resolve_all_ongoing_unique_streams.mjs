import fs from 'fs';
import path from 'path';
import { getEpisodeStreams } from '../src/lib/services/otakudesuScraper.mjs';

const CACHE_FILE = path.resolve('scripts/scraped_ongoing_cache.json');
const OUTPUT_FILE = path.resolve('scripts/unique_episodes_streams.json');

async function main() {
  console.log('🚀 Starting Resolution of Real, Unique Streams for All Ongoing Episodes...');

  if (!fs.existsSync(CACHE_FILE)) {
    console.error('❌ Cache file not found:', CACHE_FILE);
    process.exit(1);
  }

  const ongoingData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  let savedResults = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      savedResults = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      console.log(`ℹ️ Loaded ${Object.keys(savedResults).length} already-resolved episodes from cache.`);
    } catch {}
  }

  const allEps = [];
  for (const a of ongoingData) {
    const eps = a.episodes.slice(0, Math.min(a.episodes.length, 24));
    for (const ep of eps) {
      allEps.push({
        animeTitle: a.title,
        epTitle: ep.title,
        url: ep.url,
      });
    }
  }

  console.log(`Total episodes to verify/resolve: ${allEps.length}`);

  let resolvedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < allEps.length; i++) {
    const item = allEps[i];
    const key = item.url;

    if (savedResults[key] && savedResults[key].resolvedStreams?.length > 0) {
      skippedCount++;
      continue;
    }

    console.log(`[${i + 1}/${allEps.length}] Resolving: ${item.animeTitle} - ${item.epTitle}...`);
    try {
      const data = await getEpisodeStreams(item.url, { resolveAllMirrors: true });
      savedResults[key] = {
        animeTitle: item.animeTitle,
        epTitle: item.epTitle,
        episodeUrl: item.url,
        resolvedStreams: data.resolvedStreams || [],
        downloads: data.downloads || [],
        updatedAt: new Date().toISOString(),
      };
      resolvedCount++;
      console.log(`   ✅ Resolved ${data.resolvedStreams?.length || 0} stream mirrors.`);
      // Save progressively
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(savedResults, null, 2));
    } catch (err) {
      console.error(`   ❌ Failed to resolve ${item.url}:`, err.message);
      failedCount++;
    }

    // Delay to avoid aggressive rate-limits
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log('\n=============================================');
  console.log(`🎉 Stream Resolution Complete!`);
  console.log(`Total Episodes : ${allEps.length}`);
  console.log(`Newly Resolved : ${resolvedCount}`);
  console.log(`Loaded Cache   : ${skippedCount}`);
  console.log(`Failed         : ${failedCount}`);
  console.log(`Saved in       : ${OUTPUT_FILE}`);
  console.log('=============================================');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
