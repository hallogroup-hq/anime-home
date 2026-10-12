import { CharacterService } from '../src/lib/services/characterService';
import { db } from '../src/lib/services/store';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  console.log('🎭 === SEEDING KARAKTER & SEIYUU ANIME KE TURSO ===\n');

  const allAnime = db.getAnimeList();
  console.log(`Total anime tersedia di katalog: ${allAnime.length}`);

  // Pilih 25 anime terpopuler & ongoing utama
  const targetAnime = allAnime.slice(0, 25);

  let successCount = 0;
  for (const [idx, a] of targetAnime.entries()) {
    console.log(`[${idx + 1}/${targetAnime.length}] Mengambil karakter untuk: ${a.canonicalTitle}...`);
    try {
      const chars = await CharacterService.getOrFetchCharacters(a.id, a.canonicalTitle);
      console.log(`  -> Berhasil menyimpan ${chars.length} karakter & seiyuu.`);
      successCount++;
    } catch (err: any) {
      console.warn(`  -> Gagal: ${err.message}`);
    }
    // Delay 400ms to be polite to AniList GraphQL
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n🎉 Selesai! Berhasil mengumpulkan karakter untuk ${successCount} anime.`);
}

main().catch(console.error);
