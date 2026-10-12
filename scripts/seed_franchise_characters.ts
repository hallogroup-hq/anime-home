import { CharacterService } from '../src/lib/services/characterService';
import { db } from '../src/lib/services/store';
import { getTursoClient } from '../src/lib/db/tursoClient';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

// Mapping franshise alias ke judul pencarian AniList
const FRANCHISE_QUERIES: Record<string, string> = {
  'conan': 'Detective Conan',
  'attack on titan': 'Shingeki no Kyojin',
  'shingeki no kyojin': 'Shingeki no Kyojin',
  'demon slayer': 'Kimetsu no Yaiba',
  'kimetsu no yaiba': 'Kimetsu no Yaiba',
  'jujutsu kaisen': 'Jujutsu Kaisen',
  'bleach': 'Bleach',
  'haikyuu': 'Haikyuu!!',
  'ao no hako': 'Blue Box',
  'blue box': 'Blue Box',
  'black clover': 'Black Clover',
  'vinland saga': 'Vinland Saga',
  'spy x family': 'Spy x Family',
  'my hero academia': 'Boku no Hero Academia',
  'boku no hero academia': 'Boku no Hero Academia',
  'one piece': 'One Piece',
  'solo leveling': 'Solo Leveling',
  'chainsaw man': 'Chainsaw Man',
  'dandadan': 'Dandadan',
  'blue lock': 'Blue Lock',
  'kaiju no. 8': 'Kaiju No. 8',
  'kaiju 8': 'Kaiju No. 8',
};

async function main() {
  console.log('====================================================');
  console.log('🌟 ANIME HOME — PROPAGASI KARAKTER FRANCHISE LENGKAP');
  console.log('====================================================\n');

  const client = getTursoClient();
  if (!client) throw new Error('TURSO_DATABASE_URL tidak ditemukan!');

  const allAnime = db.getAnimeList();

  // 1. Ambil list anime yang belum punya karakter di Turso
  const existingCharsRs = await client.execute(`SELECT DISTINCT anime_id FROM characters;`);
  const seededIds = new Set(existingCharsRs.rows.map((r: any) => String(r.anime_id)));

  const missingAnime = allAnime.filter(a => !seededIds.has(a.id));
  console.log(`Anime yang belum memiliki karakter: ${missingAnime.length} judul.\n`);

  // Cache karakter per franchise query agar tidak request ulang ke AniList
  const franchiseCharCache = new Map<string, any[]>();

  let populatedCount = 0;

  for (const a of missingAnime) {
    const titleLower = a.canonicalTitle.toLowerCase();
    
    // Temukan key franchise yang cocok
    let matchedFranchise = Object.keys(FRANCHISE_QUERIES).find(k => titleLower.includes(k));

    if (!matchedFranchise) {
      // Coba dari slug
      const slugLower = a.slug.toLowerCase();
      matchedFranchise = Object.keys(FRANCHISE_QUERIES).find(k => slugLower.includes(k.replace(/\s+/g, '-')));
    }

    if (matchedFranchise) {
      const searchKey = FRANCHISE_QUERIES[matchedFranchise];
      
      let baseChars = franchiseCharCache.get(searchKey);
      if (!baseChars) {
        console.log(`🔍 Mengambil basis karakter franchise "${searchKey}" dari AniList...`);
        baseChars = await CharacterService.fetchFromAniList(searchKey, 'template', 8);
        if (baseChars.length > 0) {
          franchiseCharCache.set(searchKey, baseChars);
          console.log(`  -> Berhasil dapat ${baseChars.length} karakter untuk franchise "${searchKey}".`);
        }
        await new Promise(r => setTimeout(r, 650));
      }

      if (baseChars && baseChars.length > 0) {
        // Clone karakter untuk anime ID ini
        const clonedChars = baseChars.map(c => ({
          ...c,
          id: `char-${a.id}-${c.id.split('-').pop()}`,
          animeId: a.id,
        }));

        await CharacterService.saveCharactersToTurso(clonedChars);
        populatedCount++;
        console.log(`✨ [${populatedCount}] ${a.canonicalTitle} -> +${clonedChars.length} karakter (${searchKey})`);
      }
    }
  }

  const finalTotal = await client.execute('SELECT COUNT(*) as total FROM characters;');
  console.log('\n====================================================');
  console.log('🎉 SEEDING FRANCHISE SELESAI!');
  console.log(`Anime berhasil dilengkapi karakter: ${populatedCount} judul.`);
  console.log(`Total karakter tersimpan di Turso: ${finalTotal.rows[0].total}`);
  console.log('====================================================');
}

main().catch(console.error);
