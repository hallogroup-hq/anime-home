import { CharacterService } from '../src/lib/services/characterService';
import { db } from '../src/lib/services/store';
import { getTursoClient } from '../src/lib/db/tursoClient';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  console.log('====================================================');
  console.log('🎭 ANIME HOME — BATCH SEEDING SEMUA KARAKTER & SEIYUU');
  console.log('====================================================\n');

  const client = getTursoClient();
  if (!client) {
    throw new Error('TURSO_DATABASE_URL tidak ditemukan!');
  }

  // 1. Ambil semua anime
  const allAnime = db.getAnimeList();
  console.log(`Total anime di katalog: ${allAnime.length} judul.\n`);

  // 2. Ambil list anime_id yang sudah punya karakter di Turso
  const existingCharsRs = await client.execute(`
    SELECT DISTINCT anime_id FROM characters;
  `);
  const alreadySeededIds = new Set(existingCharsRs.rows.map((r: any) => String(r.anime_id)));
  console.log(`Anime yang sudah memiliki karakter: ${alreadySeededIds.size} judul.`);

  const pendingAnime = allAnime.filter(a => !alreadySeededIds.has(a.id));
  console.log(`Anime yang perlu ditarik karakternya: ${pendingAnime.length} judul.\n`);

  let addedAnimeCount = 0;
  let totalCharsAdded = 0;

  for (let i = 0; i < pendingAnime.length; i++) {
    const a = pendingAnime[i];
    const progress = `[${i + 1}/${pendingAnime.length}]`;

    try {
      // Coba fetch dari AniList
      const chars = await CharacterService.fetchFromAniList(a.canonicalTitle, a.id, 8);

      if (chars.length > 0) {
        await CharacterService.saveCharactersToTurso(chars);
        addedAnimeCount++;
        totalCharsAdded += chars.length;
        console.log(`${progress} ✨ ${a.canonicalTitle} -> +${chars.length} karakter`);
      } else {
        // Coba fallback dengan slug jika judul berbahasa Indonesia / beda ejaan
        const cleanSlugTitle = a.slug.replace(/^anime-/, '').replace(/-/g, ' ');
        const fallbackChars = await CharacterService.fetchFromAniList(cleanSlugTitle, a.id, 8);
        if (fallbackChars.length > 0) {
          await CharacterService.saveCharactersToTurso(fallbackChars);
          addedAnimeCount++;
          totalCharsAdded += fallbackChars.length;
          console.log(`${progress} ✨ ${a.canonicalTitle} (via slug) -> +${fallbackChars.length} karakter`);
        } else {
          console.log(`${progress} ⚪ ${a.canonicalTitle} -> Tidak ditemukan di AniList`);
        }
      }
    } catch (err: any) {
      console.warn(`${progress} ⚠️ Error pada "${a.canonicalTitle}":`, err.message);
    }

    // Delay 650ms untuk menghormati rate limit AniList (maks 90 req/menit)
    await new Promise(res => setTimeout(res, 650));
  }

  // Cek total akhir di database
  const finalCountRs = await client.execute('SELECT COUNT(*) as total FROM characters;');
  const totalCharactersInDb = finalCountRs.rows[0].total;

  console.log('\n====================================================');
  console.log('✅ SEEDING SELESAI!');
  console.log(`Anime baru berhasil diisi karakter: ${addedAnimeCount}`);
  console.log(`Karakter baru ditambahkan: ${totalCharsAdded}`);
  console.log(`Total karakter tersimpan di Turso saat ini: ${totalCharactersInDb}`);
  console.log('====================================================');
}

main().catch(err => {
  console.error('Fatal error seeding characters:', err);
  process.exit(1);
});
