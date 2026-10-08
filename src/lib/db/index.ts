import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

export const dbOrm = (typeof window === 'undefined' && connectionString && connectionString.startsWith('postgres'))
  ? drizzle(neon(connectionString), { schema })
  : null;

export { schema };
export * from './schema';
