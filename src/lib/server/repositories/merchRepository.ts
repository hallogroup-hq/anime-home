import { dbOrm, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { MerchItem } from '@/types';

function mapRowToMerch(row: typeof schema.merchandise.$inferSelect): MerchItem {
  return {
    id: row.id,
    name: row.name,
    animeId: row.animeId || '',
    animeTitle: row.animeTitle,
    price: row.price,
    currency: 'IDR',
    imageUrl: row.imageUrl,
    storeName: row.storeName,
    destinationUrl: row.destinationUrl,
    isAffiliate: row.isAffiliate,
    verificationState: 'verified',
  };
}

export class MerchRepository {
  public static async getMerchItems(animeId?: string): Promise<MerchItem[]> {
    if (!dbOrm) return [];

    let query = dbOrm.select().from(schema.merchandise);
    if (animeId) {
      query = query.where(eq(schema.merchandise.animeId, animeId)) as any;
    }

    const rows = await query;
    return rows.map(mapRowToMerch);
  }

  public static async createMerchItem(data: Partial<MerchItem>): Promise<MerchItem> {
    if (!dbOrm) throw new Error('Database not connected');

    const id = data.id || `merch-${Date.now()}`;

    await dbOrm.insert(schema.merchandise).values({
      id,
      animeId: data.animeId || null,
      animeTitle: data.animeTitle || 'Official Anime Merchandise',
      name: data.name || 'Merchandise Item',
      price: data.price || 50000,
      storeName: data.storeName || 'Official Shopee Mall Store',
      destinationUrl: data.destinationUrl || 'https://shopee.co.id',
      imageUrl: data.imageUrl || '',
      isAffiliate: data.isAffiliate || false,
    }).onConflictDoNothing();

    const created = await dbOrm.query.merchandise.findFirst({
      where: eq(schema.merchandise.id, id),
    });

    if (!created) throw new Error(`Failed to retrieve merchandise ${id}`);
    return mapRowToMerch(created);
  }
}
