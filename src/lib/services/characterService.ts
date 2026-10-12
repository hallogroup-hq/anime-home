import { getTursoClient } from '@/lib/db/tursoClient';
import { AnimeCharacter } from '@/types';

export class CharacterService {
  /**
   * Mengambil karakter untuk anime dari database Turso
   */
  public static async getCharactersByAnimeId(animeId: string): Promise<AnimeCharacter[]> {
    const client = getTursoClient();
    if (!client) return [];

    try {
      const rs = await client.execute({
        sql: `SELECT * FROM characters WHERE anime_id = ? ORDER BY role DESC;`,
        args: [animeId],
      });

      return rs.rows.map((r: any) => ({
        id: String(r.id),
        animeId: String(r.anime_id),
        name: String(r.name),
        role: r.role as 'Main' | 'Supporting',
        imageUrl: String(r.image_url),
        voiceActorName: String(r.voice_actor_name),
        voiceActorLanguage: String(r.voice_actor_language || 'Jepang (Japanese)'),
      }));
    } catch (err: any) {
      console.warn(`[CharacterService] Gagal query karakter untuk ${animeId}:`, err.message);
      return [];
    }
  }

  /**
   * Mengambil data karakter dan Seiyuu dari AniList GraphQL API publik
   */
  public static async fetchFromAniList(searchTitle: string, animeId: string, limit: number = 8): Promise<AnimeCharacter[]> {
    const query = `
      query ($search: String) {
        Media(search: $search, type: ANIME) {
          id
          title { romaji english native }
          characters(sort: [ROLE, FAVOURITES_DESC], perPage: 12) {
            edges {
              role
              node {
                id
                name { full native }
                image { large medium }
              }
              voiceActors(language: JAPANESE) {
                id
                name { full native }
                languageV2
              }
            }
          }
        }
      }
    `;

    // Bersihkan judul dari embel-embel sub indo dsb
    const cleanQuery = searchTitle
      .replace(/subtitle\s*indonesia/gi, '')
      .replace(/sub\s*indo/gi, '')
      .replace(/season\s*3/gi, 'Season 3')
      .replace(/season\s*2/gi, 'Season 2')
      .replace(/season\s*1/gi, '')
      .replace(/part\s*2/gi, 'Part 2')
      .replace(/[^a-zA-Z0-9\s:-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { search: cleanQuery } }),
      });

      if (!res.ok) {
        return [];
      }

      const json = await res.json();
      const edges: any[] = json.data?.Media?.characters?.edges || [];
      const result: AnimeCharacter[] = [];

      for (const edge of edges) {
        const charNode = edge.node;
        const vaNode = edge.voiceActors?.[0];

        const charName = charNode.name.full + (charNode.name.native ? ` (${charNode.name.native})` : '');
        const vaName = vaNode 
          ? vaNode.name.full + (vaNode.name.native ? ` (${vaNode.name.native})` : '')
          : 'Belum Diumumkan';

        const role: 'Main' | 'Supporting' = edge.role === 'MAIN' ? 'Main' : 'Supporting';
        const imageUrl = charNode.image.large || charNode.image.medium || 'https://s4.anilist.co/file/anilistcdn/character/large/default.jpg';

        result.push({
          id: `char-${animeId}-${charNode.id}`,
          animeId,
          name: charName,
          role,
          imageUrl,
          voiceActorName: vaName,
          voiceActorLanguage: vaNode?.languageV2 ? `Jepang (${vaNode.languageV2})` : 'Jepang (Japanese)',
        });

        if (result.length >= limit) break;
      }

      return result;
    } catch (err: any) {
      console.warn(`[CharacterService] Gagal fetch dari AniList untuk "${searchTitle}":`, err.message);
      return [];
    }
  }

  /**
   * Simpan daftar karakter ke database Turso
   */
  public static async saveCharactersToTurso(characters: AnimeCharacter[]): Promise<void> {
    const client = getTursoClient();
    if (!client || characters.length === 0) return;

    const statements = characters.map(c => ({
      sql: `INSERT OR REPLACE INTO characters (id, anime_id, name, role, image_url, voice_actor_name, voice_actor_language)
            VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [c.id, c.animeId, c.name, c.role, c.imageUrl, c.voiceActorName, c.voiceActorLanguage],
    }));

    await client.batch(statements, 'write');
  }

  /**
   * Helper: Dapatkan karakter untuk suatu anime, atau fetch dan simpan jika belum ada
   */
  public static async getOrFetchCharacters(animeId: string, title: string): Promise<AnimeCharacter[]> {
    // 1. Coba dari Turso terlebih dahulu
    const existing = await this.getCharactersByAnimeId(animeId);
    if (existing.length > 0) {
      return existing;
    }

    // 2. Jika belum ada, fetch dari AniList publik
    const fetched = await this.fetchFromAniList(title, animeId);
    if (fetched.length > 0) {
      await this.saveCharactersToTurso(fetched);
      return fetched;
    }

    return [];
  }
}
