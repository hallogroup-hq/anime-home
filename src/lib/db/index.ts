import { Pool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as dotenv from 'dotenv';

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env.local' });
  dotenv.config();
}

const connectionString = process.env.DATABASE_URL;

// Prevent multiple pools in Node development hot reloading
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

function initDb() {
  if (typeof window !== 'undefined' || !connectionString) {
    return null;
  }

  // Neon Cloud Serverless (HTTP)
  if (connectionString.includes('neon.tech')) {
    const sql = neon(connectionString);
    return drizzleNeon(sql, { schema });
  }

  // Standard TCP Postgres (local or dedicated instance)
  if (!global.__dbPool) {
    global.__dbPool = new Pool({ connectionString });
  }
  return drizzlePg(global.__dbPool, { schema });
}

export const dbOrm = initDb();
export { schema };
export * from './schema';
