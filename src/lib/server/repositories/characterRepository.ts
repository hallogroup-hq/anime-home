import { dbOrm, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { AnimeCharacter } from '@/types';

function mapRowToCharacter(row: typeof schema.characters.$inferSelect): AnimeCharacter {
  return {
    id: row.id,
    animeId: row.animeId,
    name: row.name,
    role: (row.role as any) || 'Main',
    imageUrl: row.imageUrl,
    voiceActorName: row.voiceActorName,
    voiceActorLanguage: row.voiceActorLanguage,
  };
}

export class CharacterRepository {
  public static async getCharactersByAnimeId(animeId: string): Promise<AnimeCharacter[]> {
    if (!dbOrm) return [];

    const rows = await dbOrm.select()
      .from(schema.characters)
      .where(eq(schema.characters.animeId, animeId));

    return rows.map(mapRowToCharacter);
  }
}
