import { CharacterService } from '../src/lib/services/characterService';
import { db } from '../src/lib/services/store';
import { getTursoClient } from '../src/lib/db/tursoClient';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const CUSTOM_QUERIES: Record<string, string> = {
  'One Piece': 'One Piece',
  "JoJo's Bizarre Adventure Part 7: Steel Ball Run": 'Steel Ball Run',
  'Mission: Yozakura Family Season 2 Part 2': 'Yozakura-san Chi no Daisakusen',
  'Tensei shitara Dainana Ouji Datta node, Kimama ni Majutsu wo Kiwamemasu Season 2': 'Tensei shitara Dainana Ouji',
  "A Returner's Magic Should Be Special Season 2": 'Kikansha no Mahou wa Tokubetsu desu',
  'Kikansha no Mahou wa Tokubetsu desu Season 2': 'Kikansha no Mahou wa Tokubetsu desu',
  'Tensei Kizoku, Kantei Skill de Nariagaru Season 3': 'Kantei Skill de Nariagaru',
  'Tensei shitara Ken deshita Season 2': 'Tensei shitara Ken deshita',
  'Hyouken no Majutsushi ga Sekai wo Suberu Season 2': 'Hyouken no Majutsushi ga Sekai wo Suberu',
  'Sasaki to Pii-chan Season 2': 'Sasaki to Pii-chan',
  'Shin Tennis no Oujisama: U-17 World Cup - Kesshou Member Ketteisen': 'Shin Tennis no Oujisama',
  'Tsuihou sareta Tensei Juukishi wa Game Chishiki de Musou suru': 'Tensei Juukishi',
  'Mahou Shoujo Ikusei Keikaku: Restart': 'Mahou Shoujo Ikusei Keikaku',
  'Keroro Gunsou☆ (2026)': 'Keroro Gunsou',
  'Psyren': 'Psyren',
  'Kanata kara': 'Kanata kara',
};

async function main() {
  const client = getTursoClient();
  if (!client) throw new Error('TURSO_DATABASE_URL tidak ditemukan!');

  const allAnime = db.getAnimeList();
  let count = 0;

  for (const [title, query] of Object.entries(CUSTOM_QUERIES)) {
    const anime = allAnime.find(a => a.canonicalTitle === title || a.canonicalTitle.includes(title));
    if (!anime) continue;

    console.log(`Mengambil untuk "${anime.canonicalTitle}" via query "${query}"...`);
    try {
      const chars = await CharacterService.fetchFromAniList(query, anime.id, 8);
      if (chars.length > 0) {
        await CharacterService.saveCharactersToTurso(chars);
        count++;
        console.log(`  -> Berhasil! +${chars.length} karakter`);
      } else {
        console.log(`  -> Tidak ditemukan di AniList`);
      }
    } catch (err: any) {
      console.warn(`  -> Gagal: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 650));
  }

  const finalTotal = await client.execute('SELECT COUNT(*) as total FROM characters;');
  console.log(`\n🎉 Selesai! Ditambahkan ${count} anime baru. Total karakter di Turso: ${finalTotal.rows[0].total}`);
}

main().catch(console.error);
