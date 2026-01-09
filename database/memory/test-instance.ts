import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { count } from 'drizzle-orm';
import path from 'path';
import { users } from './schema';
import { t_User, t_UserStatus } from '../../api/models';

export function createTestDatabase(seedData?: (t_User & { password: string })[]): BetterSQLite3Database {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite);

    const migrations = path.join(__dirname, 'migrations');
    migrate(db, { migrationsFolder: migrations });

    if (seedData) {
        seedUserTable(db, seedData);
    }

    return db;
}

function seedUserTable(db: BetterSQLite3Database, userData: (t_User & { password: string })[]): void {
    const counted = db.select({ value: count() }).from(users).get();
    if (counted && counted.value > 0) return;

    for (const user of userData) {
        db.insert(users)
            .values({
                id: user.id!,
                firstName: user.firstName ?? null,
                lastName: user.lastName ?? null,
                email: user.email ?? null,
                password: user.password!,
                paymentMethod: user.paymentMethod ? JSON.stringify(user.paymentMethod) : null,
                status: (user.status as t_UserStatus) ?? null,
                createdAt: user.createdAt ?? null,
                updatedAt: user.updatedAt ?? null,
            })
            .run();
    }
}
