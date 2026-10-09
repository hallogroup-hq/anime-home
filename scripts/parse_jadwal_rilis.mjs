import fs from 'fs';
import path from 'path';
import { fetchHtml } from '../src/lib/services/otakudesuScraper.mjs';

async function main() {
  console.log('Fetching /jadwal-rilis/ from Otakudesu...');
  const html = await fetchHtml('/jadwal-rilis/');

  const scheduleMap = {};
  const dayBlocks = [...html.matchAll(/<div class="kglist321"><h2>([^<]+)<\/h2><ul>(.*?)<\/ul><\/div>/gs)];

  for (const block of dayBlocks) {
    const day = block[1].trim();
    const listHtml = block[2];
    const items = [...listHtml.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)];
    scheduleMap[day] = items.map(it => ({
      title: it[2].trim(),
      url: it[1].trim(),
    }));
  }

  console.log(`Parsed ${Object.keys(scheduleMap).length} days:`);
  for (const [day, list] of Object.entries(scheduleMap)) {
    console.log(`\n📅 ${day} (${list.length} anime):`);
    for (const it of list) {
      console.log(`  - ${it.title} (${it.url})`);
    }
  }

  fs.writeFileSync('scripts/otakudesu_jadwal_rilis.json', JSON.stringify(scheduleMap, null, 2));
  console.log('\n✅ Saved to scripts/otakudesu_jadwal_rilis.json');
}

main().catch(console.error);
