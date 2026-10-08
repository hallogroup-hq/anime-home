'use client';

import { WatchlistEntry, EpisodeProgress } from '@/types';

const WATCHLIST_STORAGE_KEY = 'animehome_user_watchlist';
const PROGRESS_STORAGE_KEY = 'animehome_user_progress';

export function getLocalWatchlist(): WatchlistEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalWatchlist(entries: WatchlistEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save watchlist to localStorage', e);
  }
}

export function setWatchlistStatus(animeId: string, status: WatchlistEntry['status']) {
  const list = getLocalWatchlist();
  const existingIdx = list.findIndex(e => e.animeId === animeId);
  const updatedEntry: WatchlistEntry = {
    animeId,
    status,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    list[existingIdx] = updatedEntry;
  } else {
    list.unshift(updatedEntry);
  }
  saveLocalWatchlist(list);
  return list;
}

export function removeFromWatchlist(animeId: string) {
  const list = getLocalWatchlist().filter(e => e.animeId !== animeId);
  saveLocalWatchlist(list);
  return list;
}

export function getLocalProgress(): EpisodeProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalProgress(progressList: EpisodeProgress[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressList));
  } catch (e) {
    console.error('Failed to save progress to localStorage', e);
  }
}

export function markEpisodeWatched(animeId: string, episodeId: string, watched = true, sourceVariantId?: string) {
  const progressList = getLocalProgress();
  const existingIdx = progressList.findIndex(p => p.episodeId === episodeId);
  const updated: EpisodeProgress = {
    animeId,
    episodeId,
    watched,
    sourceVariantId,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    progressList[existingIdx] = updated;
  } else {
    progressList.unshift(updated);
  }
  saveLocalProgress(progressList);

  // Automatically ensure anime is marked as 'watching' if not yet completed
  const watchlist = getLocalWatchlist();
  const animeEntry = watchlist.find(w => w.animeId === animeId);
  if (!animeEntry || animeEntry.status === 'plan_to_watch') {
    setWatchlistStatus(animeId, 'watching');
  }

  return progressList;
}

export function getContinueWatchingList(): { animeId: string; episodeId: string; updatedAt: string }[] {
  const progressList = getLocalProgress();
  // Filter yang terakhir ditonton per anime
  const animeMap = new Map<string, EpisodeProgress>();
  for (const prog of progressList) {
    if (!animeMap.has(prog.animeId)) {
      animeMap.set(prog.animeId, prog);
    }
  }
  return Array.from(animeMap.values()).map(p => ({
    animeId: p.animeId,
    episodeId: p.episodeId,
    updatedAt: p.updatedAt,
  }));
}
