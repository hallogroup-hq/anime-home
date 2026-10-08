import { dbOrm, schema } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { AuditLog } from '@/types';

export class AuditRepository {
  public static async logAction(params: {
    actorId?: string;
    role?: string;
    action: string;
    resource: string;
    reason?: string;
    details?: string;
  }): Promise<void> {
    if (!dbOrm) return;

    try {
      await dbOrm.insert(schema.auditLogs).values({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        actorId: params.actorId || 'system',
        role: params.role || 'system',
        action: params.action,
        resource: params.resource,
        reason: params.reason || null,
        details: params.details || null,
        target: params.resource,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }

  public static async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    if (!dbOrm) return [];

    const rows = await dbOrm.select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(limit);

    return rows.map(r => ({
      id: r.id,
      actorId: r.actorId,
      role: r.role,
      action: r.action,
      resource: r.resource,
      reason: r.reason || undefined,
      timestamp: r.timestamp.toISOString(),
    }));
  }
}
