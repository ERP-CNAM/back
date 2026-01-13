// src/database/postgres/seed.ts
import 'dotenv/config';

// ✅ IMPORTANT (doit être fait AVANT d'importer le client/config)
process.env.DB_TYPE = 'in-memory';

import { users, subscriptions } from './schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { security } from '../../utils/security';

const isoNow = () => new Date().toISOString();
const isoDate = (d: Date | string) => (d instanceof Date ? d.toISOString() : new Date(d).toISOString());

// SQLite n'aime pas `undefined` → on force null si besoin
const nullIfUndef = <T>(v: T | undefined) => (v === undefined ? null : v);

async function seedUsers(db: any) {
    const hashedPassword = await security.hashPassword('Password123!');

    const demoUsers = [
        {
            id: randomUUID(),
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            password: hashedPassword,
            status: 'OK',
            paymentMethod: JSON.stringify({ type: 'CARD', cardLast4: '4242' }),
        },
        {
            id: randomUUID(),
            firstName: 'Jane',
            lastName: 'Roux',
            email: 'jane.roux@example.com',
            password: hashedPassword,
            status: 'SUSPENDED',
            paymentMethod: JSON.stringify({ type: 'SEPA', iban: 'FR76****************1234' }),
        },
    ];

    for (const user of demoUsers) {
        const existing = await db.select().from(users).where(eq(users.email, user.email));
        if (existing.length > 0) {
            console.log(`ℹ️ User ${user.email} already exists`);
            continue;
        }

        await db.insert(users).values({
            ...user,
            createdAt: isoNow(), // ✅ TEXT
            updatedAt: isoNow(), // ✅ TEXT
        });

        console.log(`✅ User ${user.email} seeded`);
    }
}

async function seedSubscriptions(db: any) {
    const rows = await db.select().from(users).where(eq(users.email, 'john.doe@example.com'));
    const john = rows[0];

    if (!john) {
        console.log('ℹ️ John not found, skipping subscriptions');
        return;
    }

    const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, john.id));
    if (existing.length > 0) {
        console.log('ℹ️ Subscription already exists');
        return;
    }

    await db.insert(subscriptions).values({
        id: randomUUID(),
        userId: john.id,
        contractCode: 'C001',
        startDate: isoDate('2026-01-01'), // ✅ TEXT ISO
        endDate: null, // ✅ null
        monthlyAmount: 15.0, // ✅ number (REAL)
        promoCode: nullIfUndef('B1M20'), // ✅ string / null
        status: 'ACTIVE',
    });

    console.log('✅ Subscription seeded');
}

async function main() {
    const { getDatabase } = await import('../client.js');
    const db = getDatabase();

    await seedUsers(db);
    await seedSubscriptions(db);

    console.log('🎉 Seed completed successfully');
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
