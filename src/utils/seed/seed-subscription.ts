import 'dotenv/config';
import { getDatabase } from '../../database/client';
import { DB_TYPE } from '../../database/config';
import { PostgresUserRepository } from '../../repository/postgres/postgres-user.repository';
import { InMemoryUserRepository } from '../../repository/memory/in-memory-user.repository';
import { PostgresSubscriptionRepository } from '../../repository/postgres/postgres-subscription.repository';
import { InMemorySubscriptionRepository } from '../../repository/memory/in-memory-subscription.repository';
import { logger } from '../logger';

/**
 * Seeds the subscription table with default subscription if it doesn't exist
 */
export async function seedSubscriptions() {
    const db = getDatabase();

    const userRepo = DB_TYPE === 'postgres' ? new PostgresUserRepository(db) : new InMemoryUserRepository(db);

    const subRepo =
        DB_TYPE === 'postgres' ? new PostgresSubscriptionRepository(db) : new InMemorySubscriptionRepository(db);

    const john = await userRepo.findByEmail('john.doe@example.com');
    if (!john) {
        logger.warn('John not found, run seedUsers first');
        return;
    }

    const existing = await subRepo.findAll?.({ userId: john.id });
    if (existing?.length) {
        logger.debug('Subscription already exists for John');
        if (john.status !== 'OK') {
            await userRepo.updateStatus(john.id!, 'OK');
            logger.info('User status updated to OK (existing subscription)');
        }
        return;
    }

    await subRepo.create({
        userId: john.id,
        contractCode: 'C001',
        startDate: '2026-01-01',
        monthlyAmount: 15.0,
        promoCode: 'B1M20',
    } as any);

    if (john.status !== 'OK') {
        await userRepo.updateStatus(john.id!, 'OK');
    }

    logger.info('Subscription created for John and user status updated to OK');
}

/**
 * Creates default subscriptions
 */
export async function createDefaultSubscriptions() {
    await seedSubscriptions();
    logger.info('Default subscriptions creation check complete');
}
