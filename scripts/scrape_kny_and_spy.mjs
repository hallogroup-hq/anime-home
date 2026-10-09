import fs from 'fs';
import path from 'path';
import { getAnimeDetails, getEpisodeStreams } from '../src/lib/services/otakudesuScraper.mjs';

const OUT_PATH = path.resolve('scripts/kny_spy_scraped_streams.json');

const TARGETS = [
  { id: 'anime-kny-s1', slug: 'https://otakudesu.blog/anime/kimetsu-yaiba-subtitle-indonesia/' },
  { id: 'anime-kny-movie-mugen', slug: 'https://otakudesu.blog/anime/kimetsu-yaiba-sub-indo/' },
  { id: 'anime-kny-s2', slug: 'https://otakudesu.blog/anime/kimetsu-yaiba-season-2-sub-indo/' },
  { id: 'anime-kny-s3', slug: 'https://otakudesu.blog/anime/kimetsu-yaiba-s3-sub-indo/' },
  { id: 'anime-spyfam-s1-p1', slug: 'https://otakudesu.blog/anime/spy-family-sub-indo/' },
  { id: 'anime-spyfam-s1-p2', slug: 'https://otakudesu.blog/anime/spy-family-p2-sub-indo/' },
  { id: 'anime-spyfam-s2', slug: 'https://otakudesu.blog/anime/spy-family-s2-sub-indo/' },
];

async function main() {
  console.log('Starting Otakudesu scraper for Kimetsu no Yaiba and Spy x Family...');
  let results = {};
  if (fs.existsSync(OUT_PATH)) {
    try {
      results = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
    } catch {}
  }

  for (const target of TARGETS) {
    console.log(`\nFetching details for ${target.id}: ${target.slug}`);
    try {
      const details = await getAnimeDetails(target.slug);
      console.log(`Found ${details.episodes.length} episodes for ${target.id}`);
      
      if (!results[target.id]) {
        results[target.id] = {
          title: details.title,
          episodes: {}
        };
      }

      // Otakudesu lists episodes newest-first. Reverse to get Ep 1, 2, 3...
      const chronologicalEps = [...details.episodes].reverse();

      for (let i = 0; i < chronologicalEps.length; i++) {
        const ep = chronologicalEps[i];
        const epNum = i + 1;
        if (results[target.id].episodes[epNum] && results[target.id].episodes[epNum].streams?.length > 0) {
          console.log(`[${target.id}] Ep ${epNum} already scraped. Skipping.`);
          continue;
        }

        console.log(`[${target.id}] Resolving Ep ${epNum}: ${ep.title}...`);
        try {
          const streamData = await getEpisodeStreams(ep.url, { resolveAllMirrors: true });
          const directStreams = streamData.resolvedStreams.filter(s => s.canEmbedDirectly);
          console.log(`  -> Found ${directStreams.length} direct embed streams (Mega/Vidhide)`);
          
          results[target.id].episodes[epNum] = {
            epNum,
            title: ep.title,
            url: ep.url,
            streams: directStreams
          };

          // Incremental save
          fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2), 'utf8');
        } catch (err) {
          console.error(`  Error resolving streams for ep ${epNum}:`, err.message);
        }

        // Brief delay between episodes to be polite
        await new Promise(r => setTimeout(r, 600));
      }
    } catch (err) {
      console.error(`Error processing target ${target.id}:`, err.message);
    }
  }

  console.log('\nAll targets processed! Final save to', OUT_PATH);
}

main().catch(console.error);
