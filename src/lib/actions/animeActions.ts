'use server';

import { revalidatePath } from 'next/cache';
import { AnimeRepository } from '@/lib/server/repositories';
import { requireRole } from './authActions';
import { Anime, AnimeTitle, MediaType } from '@/types';

export async function getAnimeListAction(params?: {
  query?: string;
  genre?: string;
  status?: string;
  year?: number;
  seasonPeriod?: string;
  mediaType?: MediaType;
  sortBy?: 'popular' | 'latest' | 'score' | 'title_asc';
}) {
  return AnimeRepository.getAnimeList(params);
}

export async function createAnimeAction(animeData: Partial<Anime>, titles?: AnimeTitle[]) {
  // Authorization: Only owner, admin, or content editor can create anime
  await requireRole(['owner', 'admin', 'editor']);

  const anime = await AnimeRepository.createAnime(animeData, titles);
  revalidatePath('/anime');
  revalidatePath('/admin/content');
  revalidatePath('/');
  return { success: true, anime };
}

export async function updateAnimeAction(id: string, updates: Partial<Anime>) {
  // Authorization: Only owner, admin, or content editor can update anime
  await requireRole(['owner', 'admin', 'editor']);

  const updated = await AnimeRepository.updateAnime(id, updates);
  if (!updated) {
    return { success: false, error: 'Anime tidak ditemukan' };
  }

  revalidatePath('/anime');
  revalidatePath(`/anime/${updated.slug}`);
  revalidatePath('/admin/content');
  revalidatePath('/');
  return { success: true, anime: updated };
}

export async function deleteAnimeAction(id: string) {
  await requireRole(['owner', 'admin']);

  const ok = await AnimeRepository.deleteAnime(id);
  if (!ok) {
    return { success: false, error: 'Gagal menghapus anime' };
  }

  revalidatePath('/anime');
  revalidatePath('/admin/content');
  revalidatePath('/');
  return { success: true };
}
