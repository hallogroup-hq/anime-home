'use server';

import { revalidatePath } from 'next/cache';
import { AniListIntegration, AniListMedia } from '@/lib/server/integrations/anilist';
import { requireRole } from './authActions';
import { dbOrm, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { AnimeRepository, EpisodeRepository, AuditRepository } from '@/lib/server/repositories';
import { AnimeTitle } from '@/types';

export async function searchAniListAction(query: string) {
  await requireRole(['owner', 'admin', 'editor']);
  try {
    return await AniListIntegration.searchAnime(query);
  } catch (err: any) {
    throw new Error(`Gagal memuat data dari AniList: ${err.message}`);
  }
}

export async function fetchOngoingAniListAction() {
  await requireRole(['owner', 'admin', 'editor']);
  try {
    return await AniListIntegration.fetchOngoingPopular();
  } catch (err: any) {
    throw new Error(`Gagal memuat anime populer dari AniList: ${err.message}`);
  }
}

export async function checkDuplicateAction(media: AniListMedia) {
  await requireRole(['owner', 'admin', 'editor']);
  return AniListIntegration.detectDuplicate(media);
}

export async function ingestAniListCandidateAction(media: AniListMedia, autoApprove: boolean = false) {
  await requireRole(['owner', 'admin', 'editor']);
  const result = await AniListIntegration.ingestCandidate(media, { autoApprove });
  revalidatePath('/admin/ingest');
  revalidatePath('/admin/content');
  revalidatePath('/anime');
  return result;
}

export async function getPendingCandidatesAction() {
  await requireRole(['owner', 'admin', 'editor']);
  return AniListIntegration.getPendingCandidates();
}

export async function approveCandidateAction(candidateId: string) {
  await requireRole(['owner', 'admin', 'editor']);
  if (!dbOrm) throw new Error('Database not connected');

  const candidate = await dbOrm.query.metadataCandidates.findFirst({
    where: eq(schema.metadataCandidates.id, candidateId),
  });

  if (!candidate) throw new Error('Kandidat tidak ditemukan');

  const titles: AnimeTitle[] = [
    {
      id: `title-${candidate.id}-romaji`,
      animeId: '',
      locale: 'ja-Latn',
      title: candidate.romajiTitle,
      titleType: 'romaji',
      normalizedTitle: candidate.romajiTitle.toLowerCase().trim(),
    }
  ];

  if (candidate.englishTitle) {
    titles.push({
      id: `title-${candidate.id}-en`,
      animeId: '',
      locale: 'en-US',
      title: candidate.englishTitle,
      titleType: 'english',
      normalizedTitle: candidate.englishTitle.toLowerCase().trim(),
    });
  }

  const createdAnime = await AnimeRepository.createAnime({
    canonicalTitle: candidate.canonicalTitle,
    mediaType: candidate.mediaType as any,
    year: candidate.year || 2024,
    seasonPeriod: (candidate.seasonPeriod as any) || 'Spring',
    airingStatus: 'airing',
    publishState: 'published',
    genres: JSON.parse(candidate.genres || '[]'),
    synopsis: candidate.synopsis || '',
    posterUrl: candidate.posterUrl || '',
    bannerUrl: candidate.bannerUrl || '',
  }, titles);

  await EpisodeRepository.batchCreateEpisodes(createdAnime.id, candidate.totalEpisodes || 12);

  await dbOrm.update(schema.metadataCandidates)
    .set({ status: 'synced' })
    .where(eq(schema.metadataCandidates.id, candidateId));

  await AuditRepository.logAction({
    actorId: 'admin',
    role: 'Content Editor',
    action: 'APPROVE_METADATA_CANDIDATE',
    resource: `MetadataCandidate:${candidateId}`,
    reason: `Manually approved and created anime "${candidate.canonicalTitle}"`,
  });

  revalidatePath('/admin/ingest');
  revalidatePath('/admin/content');
  revalidatePath('/anime');

  return { success: true, anime: createdAnime };
}

export async function rejectCandidateAction(candidateId: string, reason: string) {
  await requireRole(['owner', 'admin', 'editor']);
  if (!dbOrm) return { success: false };

  await dbOrm.update(schema.metadataCandidates)
    .set({
      status: 'rejected',
      duplicateReason: reason || 'Ditolak secara manual oleh staf',
    })
    .where(eq(schema.metadataCandidates.id, candidateId));

  revalidatePath('/admin/ingest');
  return { success: true };
}
