'use server';

import { revalidatePath } from 'next/cache';
import { EpisodeRepository } from '@/lib/server/repositories';
import { requireRole } from './authActions';
import { Episode } from '@/types';

export async function createEpisodeAction(data: Partial<Episode>) {
  await requireRole(['owner', 'admin', 'editor', 'operator']);

  const episode = await EpisodeRepository.createEpisode(data);
  revalidatePath('/admin/content');
  revalidatePath(`/watch/${episode.id}`);
  return { success: true, episode };
}

export async function batchCreateEpisodesAction(animeId: string, count: number, startOrdinal?: number) {
  await requireRole(['owner', 'admin', 'editor', 'operator']);

  const episodes = await EpisodeRepository.batchCreateEpisodes(animeId, count, startOrdinal);
  revalidatePath('/admin/content');
  return { success: true, count: episodes.length, episodes };
}

export async function updateEpisodeAction(id: string, updates: Partial<Episode>) {
  await requireRole(['owner', 'admin', 'editor', 'operator']);

  const episode = await EpisodeRepository.updateEpisode(id, updates);
  if (!episode) {
    return { success: false, error: 'Episode tidak ditemukan' };
  }

  revalidatePath('/admin/content');
  revalidatePath(`/watch/${id}`);
  return { success: true, episode };
}
