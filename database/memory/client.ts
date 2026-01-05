import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import { DB_TYPE, DB_CONFIG } from '../config';
import { users } from './schema';
import type { t_User } from '../../api/models';
import mockUsers from '../../mock/users.json';

let dbInstance: BetterSQLite3Database;
let sqliteInstance: Database.Database;

function createSchema(db: BetterSQLite3Database): void {
    db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstName TEXT,
      lastName TEXT,
      email TEXT UNIQUE,
      paymentMethod TEXT,
      status TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);
}

function seedUserTable(db: BetterSQLite3Database, userData: t_User[]): void {
    const count = db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .get();
    if (count && count.count > 0) return;

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

    createSchema(dbInstance);
    seedUserTable(dbInstance, mockUsers as t_User[]);

    return dbInstance;
}

export function createTestDatabase(seedData?: t_User[]): BetterSQLite3Database {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite);

    createSchema(db);

    if (seedData) {
        seedUserTable(db, seedData);
    }

    return db;
}
