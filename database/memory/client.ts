import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { count } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import { DB_TYPE, DB_CONFIG } from '../config';
import { users } from './schema';
import type { t_User } from '../../api/models';

let dbInstance: BetterSQLite3Database;
let sqliteInstance: Database.Database;

export function getDatabase(): BetterSQLite3Database {
    if (dbInstance) return dbInstance;

    if (DB_TYPE === 'sqlite-memory') {
        sqliteInstance = new Database(':memory:');
    } else if (DB_TYPE === 'sqlite-file') {
        sqliteInstance = new Database(DB_CONFIG.sqlite.filename);
    } else {
        throw new Error(`Database type ${DB_TYPE} not yet implemented`);
    }

    dbInstance = drizzle(sqliteInstance);

    // Apply migrations
    const migrations = path.join(__dirname, 'migrations');
    migrate(dbInstance, { migrationsFolder: migrations });

    return dbInstance;
}

export function createDatabase(seedData?: t_User[]): BetterSQLite3Database {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite);

    const migrations = path.join(__dirname, 'migrations');
    migrate(db, { migrationsFolder: migrations });

    if (seedData) {
        seedUserTable(db, seedData);
    }

    return db;
}

function seedUserTable(db: BetterSQLite3Database, userData: t_User[]): void {
    const counted = db.select({ value: count() }).from(users).get();
    if (counted && counted.value > 0) return;

    for (const user of userData) {
        db.insert(users)
            .values({
                id: user.id!,
                firstName: user.firstName ?? null,
                lastName: user.lastName ?? null,
                email: user.email ?? null,
                paymentMethod: user.paymentMethod ? JSON.stringify(user.paymentMethod) : null,
                status: user.status ?? null,
                createdAt: user.createdAt ?? null,
                updatedAt: user.updatedAt ?? null,
            })
            .run();
    }
}
