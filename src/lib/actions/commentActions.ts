'use server';

import { revalidatePath } from 'next/cache';
import { CommentRepository } from '@/lib/server/repositories';
import { getCurrentUser } from './authActions';

export async function postCommentAction(params: {
  episodeId: string;
  content: string;
  isSpoiler: boolean;
  authorName?: string;
}) {
  const user = await getCurrentUser();
  const authorName = user?.username || params.authorName || 'Tamu Anime Home';
  const avatarUrl = user?.avatarUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=100&fit=crop';

  const comment = await CommentRepository.addComment({
    episodeId: params.episodeId,
    userId: user?.id,
    authorName,
    avatarUrl,
    content: params.content,
    isSpoiler: params.isSpoiler,
  });

  revalidatePath(`/watch/${params.episodeId}`);
  return { success: true, comment };
}

export async function likeCommentAction(commentId: string, episodeId: string) {
  const likes = await CommentRepository.likeComment(commentId);
  revalidatePath(`/watch/${episodeId}`);
  return { success: true, likes };
}
