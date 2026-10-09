import { db } from '../src/lib/services/store';

const allEps = db.getAllEpisodes();
const zeroStreamByAnime = new Map<string, string[]>();
const lessThan2QualByAnime = new Map<string, string[]>();

for (const ep of allEps) {
  const anime = db.getAnimeList().find(a => a.id === ep.animeId);
  const animeTitle = anime?.canonicalTitle || ep.animeId;
  const matrix = db.getStreamMatrix(ep.id);
  
  if (matrix.qualities.length === 0) {
    if (!zeroStreamByAnime.has(animeTitle)) zeroStreamByAnime.set(animeTitle, []);
    zeroStreamByAnime.get(animeTitle)!.push(ep.displayNumber);
  } else if (matrix.qualities.length < 2) {
    if (!lessThan2QualByAnime.has(animeTitle)) lessThan2QualByAnime.set(animeTitle, []);
    lessThan2QualByAnime.get(animeTitle)!.push(ep.displayNumber);
  }
}

console.log('--- Anime with 0 stream episodes ---');
for (const [title, eps] of zeroStreamByAnime.entries()) {
  console.log(`- ${title} (${eps.length} eps): [${eps.join(', ')}]`);
}

console.log('\n--- Anime with < 2 quality episodes ---');
for (const [title, eps] of lessThan2QualByAnime.entries()) {
  console.log(`- ${title} (${eps.length} eps): [${eps.join(', ')}]`);
}
