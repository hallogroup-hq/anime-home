import { dbOrm, schema } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { StreamVariant, QualityLabel } from '@/types';
import { ProviderRepository } from './providerRepository';
import { AuditRepository } from './auditRepository';

function mapRowToStreamVariant(row: typeof schema.streamVariants.$inferSelect): StreamVariant {
  return {
    id: row.id,
    episodeId: row.episodeId,
    providerId: row.providerId,
    providerName: row.providerName,
    qualityLabel: row.qualityLabel as QualityLabel,
    sourceRef: row.sourceRef,
    embedUrl: row.embedUrl,
    audioLocale: row.audioLocale || 'ja-JP',
    subtitleLocale: row.subtitleLocale || 'id-ID',
    priority: row.priority || 0,
    verificationState: row.verificationState as any,
    moderationState: row.moderationState as any,
    lastCheckedAt: row.lastCheckedAt?.toISOString() || new Date().toISOString(),
  };
}

export class StreamRepository {
  public static async getStreamMatrix(episodeId: string): Promise<{
    episodeId: string;
    variantsByQuality: Record<QualityLabel, StreamVariant[]>;
    availableQualities: QualityLabel[];
  }> {
    if (!dbOrm) {
      return {
        episodeId,
        variantsByQuality: { 'Auto': [], '1080p': [], '720p': [], '480p': [], '360p': [], '4K': [] },
        availableQualities: [],
      };
    }

    // 1. Fetch active providers to filter out streams from paused/blocked providers
    const activeProviders = await ProviderRepository.getActiveProviders();
    const activeProviderIds = new Set(activeProviders.map(p => p.id));

    // 2. Fetch variants for this episode
    const rows = await dbOrm.select()
      .from(schema.streamVariants)
      .where(and(
        eq(schema.streamVariants.episodeId, episodeId),
        eq(schema.streamVariants.moderationState, 'approved')
      ))
      .orderBy(desc(schema.streamVariants.priority));

    const eligibleVariants = rows
      .filter(r => activeProviderIds.has(r.providerId))
      .filter(r => r.verificationState !== 'offline')
      .map(mapRowToStreamVariant);

    const variantsByQuality: Record<QualityLabel, StreamVariant[]> = {
      'Auto': [],
      '1080p': [],
      '720p': [],
      '480p': [],
      '360p': [],
      '4K': [],
    };

    for (const v of eligibleVariants) {
      if (variantsByQuality[v.qualityLabel]) {
        variantsByQuality[v.qualityLabel].push(v);
      } else {
        variantsByQuality[v.qualityLabel] = [v];
      }
    }

    const availableQualities = (['Auto', '1080p', '720p', '480p', '360p', '4K'] as QualityLabel[])
      .filter(q => (variantsByQuality[q] && variantsByQuality[q].length > 0));

    return {
      episodeId,
      variantsByQuality,
      availableQualities,
    };
  }

  public static async getAllVariants(episodeId?: string): Promise<StreamVariant[]> {
    if (!dbOrm) return [];

    let query = dbOrm.select().from(schema.streamVariants);
    if (episodeId) {
      query = query.where(eq(schema.streamVariants.episodeId, episodeId)) as any;
    }

    const rows = await (query.orderBy(desc(schema.streamVariants.priority)) as any);
    return rows.map(mapRowToStreamVariant);
  }

  public static async getVariantById(id: string): Promise<StreamVariant | null> {
    if (!dbOrm) return null;

    const row = await dbOrm.query.streamVariants.findFirst({
      where: eq(schema.streamVariants.id, id),
    });

    if (!row) return null;
    return mapRowToStreamVariant(row);
  }

  public static async addStreamVariant(data: Partial<StreamVariant>): Promise<StreamVariant> {
    if (!dbOrm) throw new Error('Database not connected');

    const id = data.id || `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const insertValues = {
      id,
      episodeId: data.episodeId!,
      providerId: data.providerId!,
      providerName: data.providerName || 'Provider',
      qualityLabel: data.qualityLabel || '720p',
      sourceRef: data.sourceRef || `ref-${id}`,
      embedUrl: data.embedUrl || '',
      audioLocale: data.audioLocale || 'ja-JP',
      subtitleLocale: data.subtitleLocale || 'id-ID',
      priority: data.priority !== undefined ? data.priority : 0,
      verificationState: data.verificationState || 'verified',
      moderationState: data.moderationState || 'approved',
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await dbOrm.insert(schema.streamVariants).values(insertValues).onConflictDoUpdate({
      target: schema.streamVariants.id,
      set: {
        providerName: insertValues.providerName,
        qualityLabel: insertValues.qualityLabel,
        sourceRef: insertValues.sourceRef,
        embedUrl: insertValues.embedUrl,
        priority: insertValues.priority,
        verificationState: insertValues.verificationState,
        moderationState: insertValues.moderationState,
        updatedAt: now,
      }
    });

    await AuditRepository.logAction({
      actorId: 'admin',
      role: 'Streaming Operator',
      action: 'ADD_STREAM_VARIANT',
      resource: `StreamVariant:${id}`,
      reason: `Added stream variant ${insertValues.qualityLabel} from ${insertValues.providerName}`,
    });

    const created = await this.getVariantById(id);
    if (!created) throw new Error(`Failed to retrieve stream variant ${id}`);
    return created;
  }

  public static async updateVariant(id: string, updates: Partial<StreamVariant>): Promise<StreamVariant | null> {
    if (!dbOrm) return null;

    const setValues: any = {
      updatedAt: new Date(),
    };

    if (updates.qualityLabel !== undefined) setValues.qualityLabel = updates.qualityLabel;
    if (updates.embedUrl !== undefined) setValues.embedUrl = updates.embedUrl;
    if (updates.priority !== undefined) setValues.priority = updates.priority;
    if (updates.verificationState !== undefined) setValues.verificationState = updates.verificationState;
    if (updates.moderationState !== undefined) setValues.moderationState = updates.moderationState;
    if (updates.lastCheckedAt !== undefined) setValues.lastCheckedAt = new Date(updates.lastCheckedAt);

    await dbOrm.update(schema.streamVariants)
      .set(setValues)
      .where(eq(schema.streamVariants.id, id));

    return this.getVariantById(id);
  }

  public static async emergencyTakedown(variantId: string, reason: string): Promise<boolean> {
    if (!dbOrm) return false;

    await dbOrm.update(schema.streamVariants)
      .set({
        moderationState: 'takedown',
        verificationState: 'offline',
        updatedAt: new Date(),
      })
      .where(eq(schema.streamVariants.id, variantId));

    await AuditRepository.logAction({
      actorId: 'admin',
      role: 'Owner',
      action: 'EMERGENCY_TAKEDOWN',
      resource: `StreamVariant:${variantId}`,
      reason: reason || 'Emergency DMCA/Compliance takedown executed',
    });

    return true;
  }

  public static async restoreVariant(variantId: string): Promise<boolean> {
    if (!dbOrm) return false;

    await dbOrm.update(schema.streamVariants)
      .set({
        moderationState: 'approved',
        verificationState: 'verified',
        updatedAt: new Date(),
      })
      .where(eq(schema.streamVariants.id, variantId));

    await AuditRepository.logAction({
      actorId: 'admin',
      role: 'Streaming Operator',
      action: 'RESTORE_STREAM_VARIANT',
      resource: `StreamVariant:${variantId}`,
      reason: 'Stream restored to approved & verified state',
    });

    return true;
  }

  public static async deleteVariant(variantId: string): Promise<boolean> {
    if (!dbOrm) return false;

    await dbOrm.delete(schema.streamVariants)
      .where(eq(schema.streamVariants.id, variantId));

    await AuditRepository.logAction({
      actorId: 'admin',
      role: 'Streaming Operator',
      action: 'DELETE_STREAM_VARIANT',
      resource: `StreamVariant:${variantId}`,
      reason: 'Stream variant deleted from database',
    });

    return true;
  }
}
