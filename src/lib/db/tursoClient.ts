import { createClient, Client } from '@libsql/client';
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './tursoSchema';
import dotenv from 'dotenv';

if (!process.env.TURSO_DATABASE_URL) {
  dotenv.config({ path: '.env.local' });
  dotenv.config();
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

let client: Client | null = null;
let db: LibSQLDatabase<typeof schema> | null = null;

export function getTursoClient(): Client | null {
  if (!url) return null;
  if (!client) {
    client = createClient({
      url,
      authToken,
    });
  }
  return client;
}

export function getTursoDb(): LibSQLDatabase<typeof schema> | null {
  if (!url) return null;
  if (!db) {
    const rawClient = getTursoClient();
    if (!rawClient) return null;
    db = drizzle(rawClient, { schema });
  }
  return db;
}

export { schema };
export * from './tursoSchema';
