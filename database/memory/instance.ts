import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DB_TYPE, DB_CONFIG } from '../config';

let sqliteInstance: Database.Database;
let dbInstance: ReturnType<typeof drizzle>;

export function getSqliteDatabase() {
    if (dbInstance) return dbInstance;

    if (DB_TYPE === 'sqlite-memory') {
        sqliteInstance = new Database(':memory:');
    } else if (DB_TYPE === 'sqlite-file') {
        const dbPath = createSqliteFile();
        sqliteInstance = new Database(dbPath);
    } else {
        throw new Error(`Invalid database type for SQLite: ${DB_TYPE}`);
    }

    dbInstance = drizzle(sqliteInstance);

    return dbInstance;
}

function createSqliteFile() {
    const dbPath = DB_CONFIG.sqlite.filename;
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    return dbPath;
}
