import { dbOrm, schema } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { FranchiseWatchOrderItem } from '@/types';

function mapRowToWatchOrder(row: typeof schema.watchOrders.$inferSelect): FranchiseWatchOrderItem {
  let canonStatus: FranchiseWatchOrderItem['canonStatus'] = 'Canon';
  if (!row.isCanon) {
    canonStatus = 'Filler / Optional';
  } else if (row.type?.includes('Movie')) {
    canonStatus = 'Canon Movie';
  }

  return {
    id: row.id,
    franchiseId: row.franchiseId,
    franchiseName: row.franchiseName,
    orderNumber: row.releaseOrder,
    animeId: row.animeId || undefined,
    title: row.title,
    slug: row.slug || undefined,
    year: row.releaseYear,
    type: (row.type as any) || 'TV Series',
    canonStatus,
    episodesCount: 12,
    note: row.note || undefined,
  };
}

export class WatchOrderRepository {
  public static async getWatchOrders(franchiseId?: string): Promise<FranchiseWatchOrderItem[]> {
    if (!dbOrm) return [];

    let query = dbOrm.select().from(schema.watchOrders);
    if (franchiseId) {
      query = query.where(eq(schema.watchOrders.franchiseId, franchiseId)) as any;
    }

    const rows = await (query.orderBy(asc(schema.watchOrders.releaseOrder)) as any);
    return rows.map(mapRowToWatchOrder);
  }
}
