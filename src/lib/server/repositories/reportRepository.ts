import { dbOrm, schema } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { BrokenStreamReport } from '@/types';
import { AuditRepository } from './auditRepository';

function mapRowToReport(row: typeof schema.brokenReports.$inferSelect): BrokenStreamReport {
  return {
    id: row.id,
    variantId: row.variantId,
    episodeId: row.episodeId,
    reason: row.reason as any,
    notes: row.notes || undefined,
    reportedAt: row.reportedAt.toISOString(),
    status: row.status as any,
  };
}

export class ReportRepository {
  public static async createReport(params: {
    variantId: string;
    episodeId: string;
    reason: BrokenStreamReport['reason'];
    notes?: string;
  }): Promise<BrokenStreamReport> {
    if (!dbOrm) throw new Error('Database not connected');

    const id = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    await dbOrm.insert(schema.brokenReports).values({
      id,
      variantId: params.variantId,
      episodeId: params.episodeId,
      reason: params.reason,
      notes: params.notes || null,
      status: 'pending',
      reportedAt: now,
    });

    // AUTO-QUARANTINE RULE: Check report threshold (>= 3 reports)
    const existingReports = await dbOrm.select()
      .from(schema.brokenReports)
      .where(and(
        eq(schema.brokenReports.variantId, params.variantId),
        eq(schema.brokenReports.status, 'pending')
      ));

    if (existingReports.length >= 3) {
      await dbOrm.update(schema.streamVariants)
        .set({
          verificationState: 'offline',
          moderationState: 'paused',
          updatedAt: now,
        })
        .where(eq(schema.streamVariants.id, params.variantId));

      await AuditRepository.logAction({
        actorId: 'system-sentinel',
        role: 'Sentinel',
        action: 'AUTO_QUARANTINE_STREAM',
        resource: `StreamVariant:${params.variantId}`,
        reason: `Automated quarantine triggered after ${existingReports.length} pending user failure reports`,
      });
    }

    const created = await this.getReportById(id);
    if (!created) throw new Error(`Failed to retrieve report ${id}`);
    return created;
  }

  public static async getReports(): Promise<BrokenStreamReport[]> {
    if (!dbOrm) return [];

    const rows = await dbOrm.select()
      .from(schema.brokenReports)
      .orderBy(desc(schema.brokenReports.reportedAt));

    return rows.map(mapRowToReport);
  }

  public static async getReportById(id: string): Promise<BrokenStreamReport | null> {
    if (!dbOrm) return null;

    const row = await dbOrm.query.brokenReports.findFirst({
      where: eq(schema.brokenReports.id, id),
    });

    if (!row) return null;
    return mapRowToReport(row);
  }

  public static async resolveReport(id: string, status: 'resolved' | 'dismissed'): Promise<boolean> {
    if (!dbOrm) return false;

    await dbOrm.update(schema.brokenReports)
      .set({ status })
      .where(eq(schema.brokenReports.id, id));

    return true;
  }
}
