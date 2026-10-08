import { dbOrm, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { HomepageConfig } from '@/types';
import { AuditRepository } from './auditRepository';

const DEFAULT_CONFIG: HomepageConfig = {
  heroAnimeId: 'anime-frieren',
  sections: [
    { id: 'hero', name: 'Sorotan Utama (Hero Spotlight)', enabled: true },
    { id: 'continue_watching', name: 'Lanjutkan Menonton', enabled: true },
    { id: 'latest_episodes', name: 'Episode Terbaru', enabled: true },
    { id: 'ad_banner', name: 'Banner Sponsor (Leaderboard)', enabled: true },
    { id: 'popular', name: 'Populer Musim Ini', enabled: true },
  ],
};

export class CmsRepository {
  public static async getHomepageConfig(): Promise<HomepageConfig> {
    if (!dbOrm) return DEFAULT_CONFIG;

    const row = await dbOrm.query.homepageConfigs.findFirst({
      where: eq(schema.homepageConfigs.id, 'default'),
    });

    if (!row) {
      // Initialize default in DB
      try {
        await dbOrm.insert(schema.homepageConfigs).values({
          id: 'default',
          heroAnimeId: DEFAULT_CONFIG.heroAnimeId,
          sections: JSON.stringify(DEFAULT_CONFIG.sections),
          updatedAt: new Date(),
        }).onConflictDoNothing();
      } catch (e) {
        console.warn('Failed to insert default homepage config:', e);
      }
      return DEFAULT_CONFIG;
    }

    try {
      const parsedSections = JSON.parse(row.sections);
      return {
        heroAnimeId: row.heroAnimeId,
        sections: parsedSections,
      };
    } catch {
      return {
        heroAnimeId: row.heroAnimeId,
        sections: DEFAULT_CONFIG.sections,
      };
    }
  }

  public static async updateHomepageConfig(config: HomepageConfig): Promise<HomepageConfig> {
    if (!dbOrm) return config;

    const now = new Date();
    await dbOrm.insert(schema.homepageConfigs).values({
      id: 'default',
      heroAnimeId: config.heroAnimeId,
      sections: JSON.stringify(config.sections),
      updatedAt: now,
    }).onConflictDoUpdate({
      target: schema.homepageConfigs.id,
      set: {
        heroAnimeId: config.heroAnimeId,
        sections: JSON.stringify(config.sections),
        updatedAt: now,
      }
    });

    await AuditRepository.logAction({
      actorId: 'admin',
      role: 'Content Editor',
      action: 'UPDATE_HOMEPAGE_LAYOUT',
      resource: 'HomepageConfig:default',
      reason: `Updated homepage CMS layout. Hero Anime ID: ${config.heroAnimeId}`,
    });

    return config;
  }
}
