import { dbOrm, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { Provider } from '@/types';

function mapRowToProvider(row: typeof schema.providers.$inferSelect): Provider {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    providerType: row.providerType as any,
    apiAdapterKey: row.apiAdapterKey as any,
    status: row.status as any,
    termsUrl: row.termsUrl || undefined,
  };
}

export class ProviderRepository {
  public static async getProviders(): Promise<Provider[]> {
    if (!dbOrm) return [];

    const rows = await dbOrm.select()
      .from(schema.providers)
      .orderBy(desc(schema.providers.createdAt));

    return rows.map(mapRowToProvider);
  }

  public static async getActiveProviders(): Promise<Provider[]> {
    if (!dbOrm) return [];

    const rows = await dbOrm.select()
      .from(schema.providers)
      .where(eq(schema.providers.status, 'active'));

    return rows.map(mapRowToProvider);
  }

  public static async getProviderById(id: string): Promise<Provider | null> {
    if (!dbOrm) return null;

    const row = await dbOrm.query.providers.findFirst({
      where: eq(schema.providers.id, id),
    });

    if (!row) return null;
    return mapRowToProvider(row);
  }

  public static async registerProvider(data: Partial<Provider>): Promise<Provider> {
    if (!dbOrm) throw new Error('Database not connected');

    const id = data.id || `prov-${Date.now()}`;
    const now = new Date();

    const insertValues = {
      id,
      name: data.name || 'Unknown Provider',
      domain: data.domain || 'localhost',
      providerType: data.providerType || 'embed',
      apiAdapterKey: data.apiAdapterKey || 'custom_embed',
      status: data.status || 'active',
      termsUrl: data.termsUrl || null,
      createdAt: now,
    };

    await dbOrm.insert(schema.providers).values(insertValues).onConflictDoUpdate({
      target: schema.providers.id,
      set: {
        name: insertValues.name,
        domain: insertValues.domain,
        providerType: insertValues.providerType,
        apiAdapterKey: insertValues.apiAdapterKey,
        status: insertValues.status,
        termsUrl: insertValues.termsUrl,
      }
    });

    const created = await this.getProviderById(id);
    if (!created) throw new Error(`Failed to retrieve provider ${id}`);
    return created;
  }

  public static async updateProviderStatus(id: string, status: 'active' | 'paused' | 'blocked'): Promise<Provider | null> {
    if (!dbOrm) return null;

    await dbOrm.update(schema.providers)
      .set({ status })
      .where(eq(schema.providers.id, id));

    return this.getProviderById(id);
  }

  public static async isDomainAllowed(embedUrl: string): Promise<boolean> {
    try {
      const parsed = new URL(embedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      const host = parsed.hostname.toLowerCase();

      // Official whitelisted hosts
      const staticWhitelist = ['youtube.com', 'www.youtube.com', 'youtu.be', 'player.vimeo.com'];
      if (staticWhitelist.includes(host)) {
        return true;
      }

      // Check registered active provider domains
      const activeProviders = await this.getActiveProviders();
      return activeProviders.some(p => {
        const provDomain = p.domain.toLowerCase().trim();
        return host === provDomain || host.endsWith(`.${provDomain}`);
      });
    } catch {
      return false;
    }
  }
}
