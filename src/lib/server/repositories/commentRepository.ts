import { dbOrm, schema } from '@/lib/db';
import { eq, desc, sql } from 'drizzle-orm';
import { EpisodeComment } from '@/types';

function mapRowToComment(row: typeof schema.comments.$inferSelect): EpisodeComment {
  return {
    id: row.id,
    episodeId: row.episodeId,
    authorName: row.username,
    avatarUrl: row.avatarUrl,
    content: row.content,
    isSpoiler: row.isSpoiler,
    likes: row.likesCount,
    createdAt: row.createdAt.toISOString(),
  };
}

export class CommentRepository {
  public static async getCommentsByEpisodeId(episodeId: string): Promise<EpisodeComment[]> {
    if (!dbOrm) return [];

    const rows = await dbOrm.select()
      .from(schema.comments)
      .where(eq(schema.comments.episodeId, episodeId))
      .orderBy(desc(schema.comments.createdAt));

    return rows.map(mapRowToComment);
  }

  public static async addComment(params: {
    episodeId: string;
    userId?: string;
    authorName: string;
    avatarUrl?: string;
    content: string;
    isSpoiler: boolean;
  }): Promise<EpisodeComment> {
    if (!dbOrm) throw new Error('Database not connected');

    const id = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    await dbOrm.insert(schema.comments).values({
      id,
      episodeId: params.episodeId,
      userId: params.userId || 'guest-user',
      username: params.authorName || 'Tamu Anime Home',
      avatarUrl: params.avatarUrl || 'https://s4.anilist.co/file/anilistcdn/character/large/b176754-PCnpqIOkjhFk.png',
      content: params.content,
      isSpoiler: params.isSpoiler,
      likesCount: 0,
      createdAt: now,
    });

    const created = await dbOrm.query.comments.findFirst({
      where: eq(schema.comments.id, id),
    });

    if (!created) throw new Error(`Failed to retrieve comment ${id}`);
    return mapRowToComment(created);
  }

  public static async likeComment(commentId: string): Promise<number> {
    if (!dbOrm) return 0;

    await dbOrm.update(schema.comments)
      .set({
        likesCount: sql`${schema.comments.likesCount} + 1`
      })
      .where(eq(schema.comments.id, commentId));

    const updated = await dbOrm.query.comments.findFirst({
      where: eq(schema.comments.id, commentId),
    });

    return updated?.likesCount || 0;
  }
}
