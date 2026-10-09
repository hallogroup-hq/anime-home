import { Season, Episode, StreamVariant, SeasonReadinessState, Provider } from '@/types';

export interface SeasonVerificationResult {
  seasonId: string;
  animeId: string;
  canonicalEpisodesCount: number;
  airedEpisodesCount: number;
  verifiedEpisodesCount: number;
  missingEpisodes: number[];
  readinessState: SeasonReadinessState;
  hasPlayableStreams: boolean;
  isFullyPlayable: boolean;
  completionPercentage: number;
}

export function computeSeasonReadiness(
  season: Season,
  episodes: Episode[],
  variants: StreamVariant[],
  providers?: Provider[]
): SeasonVerificationResult {
  const activeProviderIds = new Set(
    (providers || [])
      .filter(p => p.status === 'active')
      .map(p => p.id)
  );

  const seasonEpisodes = episodes.filter(e => e.animeId === season.animeId);
  const canonicalCount = Math.max(season.canonicalEpisodesCount, seasonEpisodes.length, 1);

  // Hitung episode yang sudah tayang
  const airedEpisodes = seasonEpisodes.filter(e => e.airingState === 'aired');
  const airedCount = Math.max(season.airedEpisodesCount, airedEpisodes.length);

  // Cari episode yang memiliki stream varian terverifikasi dan disetujui
  const verifiedEpisodeIds = new Set<string>();
  const unverifiedEpisodeIds = new Set<string>();

  for (const ep of seasonEpisodes) {
    const epVariants = variants.filter(v => v.episodeId === ep.id);
    const hasVerifiedVariant = epVariants.some(v => 
      v.verificationState === 'verified' && 
      v.moderationState === 'approved' &&
      (providers ? activeProviderIds.has(v.providerId) : true)
    );
    const hasAnyVariant = epVariants.some(v => v.moderationState === 'approved');

    if (ep.watchabilityState === 'eligible_verified' && hasVerifiedVariant) {
      verifiedEpisodeIds.add(ep.id);
    } else if (hasAnyVariant) {
      unverifiedEpisodeIds.add(ep.id);
    }
  }

  const verifiedCount = verifiedEpisodeIds.size;

  // Deteksi nomor episode yang hilang (gap)
  const missingEpisodes: number[] = [];
  const targetCheckCount = airedCount > 0 ? airedCount : canonicalCount;

  for (let ord = 1; ord <= targetCheckCount; ord++) {
    const ep = seasonEpisodes.find(e => e.ordinal === ord);
    if (!ep || !verifiedEpisodeIds.has(ep.id)) {
      missingEpisodes.push(ord);
    }
  }

  // Tentukan SeasonReadinessState secara deterministik
  let readinessState: SeasonReadinessState;

  if (season.licenseType === 'svod_exclusive' && verifiedCount === 0) {
    readinessState = airedCount > 0 ? 'UNAVAILABLE' : 'AWAITING_EPISODE';
  } else if (airedCount >= canonicalCount && canonicalCount > 0) {
    // Musim Selesai (Completed Season)
    if (verifiedCount >= canonicalCount) {
      readinessState = 'READY_COMPLETE';
    } else if (verifiedCount > 0) {
      readinessState = 'INCOMPLETE';
    } else if (unverifiedEpisodeIds.size > 0) {
      readinessState = 'SOURCE_UNVERIFIED';
    } else {
      readinessState = 'UNAVAILABLE';
    }
  } else if (airedCount > 0) {
    // Musim Sedang Tayang (Ongoing Season)
    if (verifiedCount >= airedCount) {
      readinessState = 'READY_ONGOING';
    } else if (verifiedCount > 0) {
      readinessState = 'INCOMPLETE';
    } else if (unverifiedEpisodeIds.size > 0) {
      readinessState = 'SOURCE_UNVERIFIED';
    } else {
      readinessState = 'UNAVAILABLE';
    }
  } else {
    // Belum Ada Episode yang Tayang
    if (unverifiedEpisodeIds.size > 0) {
      readinessState = 'SOURCE_UNVERIFIED';
    } else {
      readinessState = 'AWAITING_EPISODE';
    }
  }

  const completionPercentage = canonicalCount > 0 
    ? Math.min(100, Math.round((verifiedCount / canonicalCount) * 100))
    : 0;

  return {
    seasonId: season.id,
    animeId: season.animeId,
    canonicalEpisodesCount: canonicalCount,
    airedEpisodesCount: airedCount,
    verifiedEpisodesCount: verifiedCount,
    missingEpisodes,
    readinessState,
    hasPlayableStreams: verifiedCount > 0,
    isFullyPlayable: readinessState === 'READY_COMPLETE',
    completionPercentage,
  };
}

export function getReadinessBadge(readinessState: SeasonReadinessState) {
  switch (readinessState) {
    case 'READY_COMPLETE':
      return {
        label: 'Musim Lengkap (100% Free)',
        shortLabel: 'READY COMPLETE',
        color: 'emerald',
        bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dotClass: 'bg-emerald-400',
        description: 'Semua episode musim ini terverifikasi dan dapat ditonton gratis langsung di situs.',
      };
    case 'READY_ONGOING':
      return {
        label: 'Simulcast Aktif (Free)',
        shortLabel: 'READY ONGOING',
        color: 'sky',
        bgClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        dotClass: 'bg-sky-400',
        description: 'Seluruh episode yang telah tayang hingga minggu ini tersedia gratis dengan takarir resmi.',
      };
    case 'INCOMPLETE':
      return {
        label: 'Sebagian Tersedia (Ada Gap)',
        shortLabel: 'INCOMPLETE',
        color: 'amber',
        bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dotClass: 'bg-amber-400',
        description: 'Sebagian episode tersedia, namun ada episode yang belum memiliki sumber streaming legal gratis.',
      };
    case 'AWAITING_EPISODE':
      return {
        label: 'Menunggu Penayangan',
        shortLabel: 'AWAITING EPISODE',
        color: 'indigo',
        bgClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        dotClass: 'bg-indigo-400',
        description: 'Episode belum tayang di televisi Jepang sesuai jadwal siaran.',
      };
    case 'SOURCE_UNVERIFIED':
      return {
        label: 'Sumber Dalam Verifikasi',
        shortLabel: 'SOURCE UNVERIFIED',
        color: 'purple',
        bgClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        dotClass: 'bg-purple-400',
        description: 'Sumber video terdaftar namun sedang melewati proses audit kualitas dan kepatuhan.',
      };
    case 'UNAVAILABLE':
    default:
      return {
        label: 'Eksklusif Platform Resmi',
        shortLabel: 'UNAVAILABLE',
        color: 'zinc',
        bgClass: 'bg-zinc-800/80 text-zinc-400 border-white/[0.08]',
        dotClass: 'bg-zinc-500',
        description: 'Hak siar video berada di platform SVOD resmi berbayar atau belum memiliki izin embed gratis.',
      };
  }
}
