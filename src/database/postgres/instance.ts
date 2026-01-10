import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DB_CONFIG } from '../config';
import * as schema from './schema';

let pool: Pool;
let db: ReturnType<typeof drizzle>;

export function getPostgresDatabase() {
    if (db) return db;

    if (!DB_CONFIG.postgres.url) {
        throw new Error('DATABASE_URL is not set for postgres configuration');
    }

    pool = new Pool({
        connectionString: DB_CONFIG.postgres.url,
    });

    db = drizzle(pool, { schema });
    return db;
}
