import 'dotenv/config';

process.env.DB_TYPE = 'in-memory';

import { users, admins, subscriptions } from './schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { security } from '../../utils/security';
import { logger } from '../../utils/logger';

const seedLogger = logger.child({ component: 'seeder' });

async function seedAdmins(db: any) {
    const email = process.env.ADMIN_EMAIL ?? 'admin@gamers-erp.com';
    const password = process.env.ADMIN_PASSWORD ?? 'Admin123!';
    const firstName = process.env.ADMIN_FIRSTNAME ?? 'Super';
    const lastName = process.env.ADMIN_LASTNAME ?? 'Admin';

    const existing = await db.select().from(admins).where(eq(admins.email, email));
    if (existing.length > 0) {
        seedLogger.info('Admin already exists');
        return;
    }

    const hashedPassword = await security.hashPassword(password);

    await db.insert(admins).values({
        id: randomUUID(),
        firstName,
        lastName,
        email,
        password: hashedPassword,
        isActive: 'true',
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    seedLogger.info('Admin seeded');
}

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
            seedLogger.debug(`User ${user.email} already exists`);
            continue;
        }

        await db.insert(users).values({
            ...user,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        seedLogger.info(`User ${user.email} seeded`);
    }
}

async function seedSubscriptions(db: any) {
    const rows = await db.select().from(users).where(eq(users.email, 'john.doe@example.com'));
    const john = rows[0];
    if (!john) {
        seedLogger.warn('John not found, skipping subscriptions');
        return;
    }

    const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, john.id));
    if (existing.length > 0) {
        seedLogger.info('Subscription already exists');
        return;
    }

    await db.insert(subscriptions).values({
        id: randomUUID(),
        userId: john.id,
        contractCode: 'C001',
        startDate: new Date('2026-01-01'),
        endDate: null,
        monthlyAmount: '15.00',
        promoCode: 'B1M20',
        status: 'ACTIVE',
    });

    seedLogger.info('Subscription seeded');
}

async function main() {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Seed forbidden in production');
    }

    // Import dynamique: garantit que dotenv + DB_TYPE sont déjà posés
    const { getDatabase } = await import('../client.js');
    const db = getDatabase();

    // Petit check utile
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set (check your .env)');
    }

    seedLogger.info('Seeding Postgres database...');

    await seedAdmins(db);
    await seedUsers(db);
    await seedSubscriptions(db);

    seedLogger.info('Seed completed successfully');
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        seedLogger.error(err, 'Seed failed');
        process.exit(1);
    });
