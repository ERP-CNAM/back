import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import path from 'path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

let sqliteInstance: Database.Database;
let dbInstance: ReturnType<typeof drizzle>;

export function getInMemoryDatabase() {
    if (dbInstance) return dbInstance;

    sqliteInstance = new Database(':memory:');
    dbInstance = drizzle(sqliteInstance);

    const migrationsFolder = path.join(__dirname, 'migrations');
    migrate(dbInstance, { migrationsFolder });

    return dbInstance;
}
