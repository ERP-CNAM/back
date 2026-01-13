import 'dotenv/config';
import { getDatabase } from '../database/client';
import { DB_TYPE } from '../database/config';
import { PostgresUserRepository } from '../repository/postgres/postgres-user.repository';
import { InMemoryUserRepository } from '../repository/memory/in-memory-user.repository';
import { PostgresSubscriptionRepository } from '../repository/postgres/postgres-subscription.repository';
import { InMemorySubscriptionRepository } from '../repository/memory/in-memory-subscription.repository';

export async function seedSubscriptions() {
    const db = getDatabase();

    const userRepo = DB_TYPE === 'postgres' ? new PostgresUserRepository(db) : new InMemoryUserRepository(db);

    const subRepo =
        DB_TYPE === 'postgres' ? new PostgresSubscriptionRepository(db) : new InMemorySubscriptionRepository(db);

    const john = await userRepo.findByEmail('john.doe@example.com');
    if (!john) {
        console.log('John not found, run seedUsers first');
        return;
    }

    const existing = await subRepo.findAll?.({ userId: john.id });
    if (existing?.length) {
        console.log('ℹSubscription already exists for John');
        return;
    }

    await subRepo.create({
        userId: john.id,
        contractCode: 'C001',
        startDate: '2026-01-01',
        monthlyAmount: 15.0,
        promoCode: 'B1M20',
    } as any);

    console.log('Subscription created for John');
}
export async function createDefaultSubscriptions() {
    if (process.env.NODE_ENV === 'production') return;
    await seedSubscriptions();
    console.log('Default subscriptions created!');
}
