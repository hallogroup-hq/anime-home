import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const LIVE_DATA_PATH = path.resolve(__dirname, '../src/lib/data/live_data.json');

interface MergeRule {
  targetId: string;
  sourceIds: string[];
  preferredSchedule?: string;
}

const MERGE_RULES: MergeRule[] = [
  {
    targetId: 'anime-aoashi',
    sourceIds: ['anime-ao-ashi-s2'],
    preferredSchedule: 'Minggu, 17:00 WIB',
  },
  {
    targetId: 'anime-yasei-no-last-boss-ga-arawareta-season-2',
    sourceIds: [
      'anime-yasei-no-last-boss-ga-arawareta-2nd-season',
      'anime-yasei-no-last-boss-ga-arawareta-s2',
    ],
    preferredSchedule: 'Sabtu, 19:00 WIB',
  },
  {
    targetId: 'anime-otk-tensei-shitara-ken-deshita-season-2',
    sourceIds: [
      'anime-tensei-shitara-ken-deshita-ii',
      'anime-tensei-shitara-ken-deshita-s2',
    ],
    preferredSchedule: 'Kamis, 20:00 WIB',
  },
  {
    targetId: 'anime-otk-kikansha-no-mahou-wa-tokubetsu-desu-season-2',
    sourceIds: ['anime-kikansha-no-mahou-wa-tokubetsu-desu-2nd-season'],
    preferredSchedule: 'Kamis, 20:00 WIB',
  },
  {
    targetId: 'anime-otk-koori-no-jouheki-season-2',
    sourceIds: ['anime-koori-no-jouheki-2nd-season'],
    preferredSchedule: 'Kamis, 20:00 WIB',
  },
  {
    targetId: 'anime-otk-hyouken-no-majutsushi-ga-sekai-wo-suberu-season-2',
    sourceIds: [
      'anime-hyouken-no-majutsushi-ga-sekai-wo-suberu-ii',
      'anime-hyouken-no-majutsushi-ga-sekai-wo-suberu-s2',
    ],
    preferredSchedule: 'Jumat, 20:00 WIB',
  },
  {
    targetId: 'anime-kusuriya-no-hitorigoto-season-3',
    sourceIds: ['anime-kusuriya-no-hitorigoto-3rd-season'],
    preferredSchedule: 'Sabtu, 19:00 WIB',
  },
  {
    targetId: 'anime-tanmoshi-s2',
    sourceIds: [
      'anime-tantei-wa-mou-shindeiru-s2',
      'anime-otk-tantei-wa-mou-shindeiru-season-2',
    ],
    preferredSchedule: 'Senin, 20:30 WIB',
  },
  {
    targetId: 'anime-otk-shin-tennis-no-oujisama-u-17-world-cup-kesshou-member-ketteisen',
    sourceIds: [
      'anime-shin-tennis-no-oujisama-u-17-world-cup-8211-kesshou-member-ketteisen',
    ],
    preferredSchedule: 'Kamis, 20:00 WIB',
  },
  {
    targetId: 'anime-overgeared',
    sourceIds: ['anime-otk-tempal-item-no-chikara'],
    preferredSchedule: 'Kamis, 21:00 WIB',
  },
  {
    targetId: 'anime-tsuihou-sareta-cheat-fuyo-majutsushi',
    sourceIds: ['anime-otk-chii-fuyo'],
    preferredSchedule: 'Selasa, 20:00 WIB',
  },
  {
    targetId: 'anime-yozakura-san-chi-no-daisakusen-season-2-part-2',
    sourceIds: ['anime-mission-yozakura-family-season-2-part-2'],
    preferredSchedule: 'Minggu, 19:00 WIB',
  },
];

export function deduplicateLiveData(): {
  removedCount: number;
  mergedVariantsCount: number;
  movedEpisodesCount: number;
} {
  const raw = fs.readFileSync(LIVE_DATA_PATH, 'utf8');
  const data = JSON.parse(raw);

  let removedCount = 0;
  let mergedVariantsCount = 0;
  let movedEpisodesCount = 0;

  const animeMap = new Map<string, any>(data.anime.map((a: any) => [a.id, a]));
  const removedAnimeIds = new Set<string>();

  for (const rule of MERGE_RULES) {
    const target = animeMap.get(rule.targetId);
    if (!target) {
      console.warn(`[Deduplicate] Target ${rule.targetId} not found, skipping.`);
      continue;
    }

    if (rule.preferredSchedule) {
      target.scheduleWIB = rule.preferredSchedule;
    }

    if (!Array.isArray(target.aliases)) {
      target.aliases = [];
    }

    for (const srcId of rule.sourceIds) {
      const src = animeMap.get(srcId);
      if (!src) continue;

      removedAnimeIds.add(srcId);
      removedCount++;

      // 1. Preserve source title as alias
      const normSrc = src.canonicalTitle.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      const alreadyHasAlias = target.aliases.some((al: any) =>
        al.title.toLowerCase() === src.canonicalTitle.toLowerCase() ||
        (al.normalizedTitle && al.normalizedTitle === normSrc)
      );

      if (!alreadyHasAlias) {
        target.aliases.push({
          id: `alias-${src.slug}`,
          animeId: target.id,
          locale: 'id-ID',
          title: src.canonicalTitle,
          titleType: 'alias',
          normalizedTitle: normSrc,
        });
      }

      // Also copy any aliases from source to target
      if (Array.isArray(src.aliases)) {
        for (const srcAl of src.aliases) {
          const normAl = (srcAl.title || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
          if (!target.aliases.some((al: any) => al.title.toLowerCase() === srcAl.title.toLowerCase())) {
            target.aliases.push({
              ...srcAl,
              id: `alias-${src.slug}-${Math.random().toString(36).slice(2, 6)}`,
              animeId: target.id,
              normalizedTitle: normAl,
            });
          }
        }
      }

      // 2. Merge episodes
      const srcEpisodes = data.episodes.filter((e: any) => e.animeId === srcId);
      for (const srcEp of srcEpisodes) {
        const targetEp = data.episodes.find((e: any) => e.animeId === target.id && e.ordinal === srcEp.ordinal);
        const srcVariants = data.variants.filter((v: any) => v.episodeId === srcEp.id);

        if (targetEp) {
          // Merge stream variants into existing target episode
          const targetVariants = data.variants.filter((v: any) => v.episodeId === targetEp.id);
          const existingEmbeds = new Set(targetVariants.map((v: any) => v.embedUrl));

          for (const sv of srcVariants) {
            if (!existingEmbeds.has(sv.embedUrl)) {
              sv.episodeId = targetEp.id;
              sv.id = `var-${targetEp.id}-${Math.random().toString(36).slice(2, 7)}`;
              mergedVariantsCount++;
            }
          }
        } else {
          // Move srcEp to target
          srcEp.animeId = target.id;
          const oldEpId = srcEp.id;
          srcEp.id = `ep-${target.slug}-${srcEp.ordinal}`;

          for (const sv of srcVariants) {
            sv.episodeId = srcEp.id;
          }
          movedEpisodesCount++;
        }
      }

      // 3. Merge seasons
      const srcSeasons = (data.seasons || []).filter((s: any) => s.animeId === srcId);
      const targetSeason = (data.seasons || []).find((s: any) => s.animeId === target.id);
      for (const ss of srcSeasons) {
        if (targetSeason) {
          targetSeason.canonicalEpisodesCount = Math.max(targetSeason.canonicalEpisodesCount || 0, ss.canonicalEpisodesCount || 0);
          targetSeason.verifiedEpisodesCount = Math.max(targetSeason.verifiedEpisodesCount || 0, ss.verifiedEpisodesCount || 0);
          targetSeason.airedEpisodesCount = Math.max(targetSeason.airedEpisodesCount || 0, ss.airedEpisodesCount || 0);
        }
      }
    }

    // Recalculate target's totalCanonicalEpisodes
    const allTargetEps = data.episodes.filter((e: any) => e.animeId === target.id);
    const maxEp = allTargetEps.reduce((m: number, e: any) => Math.max(m, e.ordinal || 0), 0);
    target.totalCanonicalEpisodes = maxEp;

    const tSeason = (data.seasons || []).find((s: any) => s.animeId === target.id);
    if (tSeason) {
      tSeason.canonicalEpisodesCount = Math.max(tSeason.canonicalEpisodesCount || 0, maxEp);
      tSeason.verifiedEpisodesCount = Math.max(tSeason.verifiedEpisodesCount || 0, maxEp);
      tSeason.airedEpisodesCount = Math.max(tSeason.airedEpisodesCount || 0, maxEp);
    }
  }

  // Remove duplicate anime records
  data.anime = data.anime.filter((a: any) => !removedAnimeIds.has(a.id));

  // Remove episodes that still point to removed anime
  data.episodes = data.episodes.filter((e: any) => !removedAnimeIds.has(e.animeId));

  // Remove seasons that still point to removed anime
  if (Array.isArray(data.seasons)) {
    data.seasons = data.seasons.filter((s: any) => !removedAnimeIds.has(s.animeId));
  }

  // Remove orphaned variants
  const activeEpisodeIds = new Set(data.episodes.map((e: any) => e.id));
  data.variants = data.variants.filter((v: any) => activeEpisodeIds.has(v.episodeId));

  fs.writeFileSync(LIVE_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

  console.log(`[Deduplicate] Successfully merged:`);
  console.log(`  - Duplicate Anime Removed: ${removedCount}`);
  console.log(`  - Stream Variants Merged: ${mergedVariantsCount}`);
  console.log(`  - Episodes Reassigned: ${movedEpisodesCount}`);
  console.log(`  - Remaining Unique Anime: ${data.anime.length}`);

  return { removedCount, mergedVariantsCount, movedEpisodesCount };
}

export async function deduplicateWithTurso(): Promise<{
  removedCount: number;
  mergedVariantsCount: number;
  movedEpisodesCount: number;
}> {
  const result = deduplicateLiveData();

  if (process.env.TURSO_DATABASE_URL) {
    try {
      const { getTursoClient } = await import('../src/lib/db/tursoClient');
      const client = getTursoClient();
      if (client) {
        for (const rule of MERGE_RULES) {
          for (const srcId of rule.sourceIds) {
            const srcEps = await client.execute({
              sql: 'SELECT id, ordinal FROM episodes WHERE anime_id = ?;',
              args: [srcId],
            });
            const targetEps = await client.execute({
              sql: 'SELECT id, ordinal FROM episodes WHERE anime_id = ?;',
              args: [rule.targetId],
            });

            for (const sEp of srcEps.rows as any[]) {
              const tEp = (targetEps.rows as any[]).find(t => t.ordinal === sEp.ordinal);
              if (tEp) {
                await client.execute({
                  sql: 'UPDATE stream_variants SET episode_id = ? WHERE episode_id = ?;',
                  args: [tEp.id, sEp.id],
                });
              }
            }

            await client.execute({ sql: 'DELETE FROM episodes WHERE anime_id = ?;', args: [srcId] });
            await client.execute({ sql: 'DELETE FROM seasons WHERE anime_id = ?;', args: [srcId] });
            await client.execute({ sql: 'DELETE FROM anime_titles WHERE anime_id = ?;', args: [srcId] });
            await client.execute({ sql: 'DELETE FROM anime WHERE id = ?;', args: [srcId] });
          }

          if (rule.preferredSchedule) {
            await client.execute({
              sql: 'UPDATE anime SET schedule_wib = ? WHERE id = ?;',
              args: [rule.preferredSchedule, rule.targetId],
            });
          }
        }
        console.log('[Deduplicate] Turso Cloud Database successfully deduplicated.');
      }
    } catch (err: any) {
      console.warn('[Deduplicate] Turso sync error:', err.message);
    }
  }

  return result;
}

if (require.main === module) {
  deduplicateWithTurso().catch(console.error);
}
