import { logger } from '../logger';
import { createDefaultAdmin } from './seed-admin';
import { createDefaultUsers } from './seed-user';
import { createDefaultSubscriptions } from './seed-subscription';
import { createDefaultInvoices } from './seed-invoice';

type SeedStep = {
    name: string;
    function: () => Promise<void>;
};

const SEED_STEPS: SeedStep[] = [
    { name: 'Admin', function: createDefaultAdmin },
    { name: 'Users', function: createDefaultUsers },
    { name: 'Subscriptions', function: createDefaultSubscriptions },
    { name: 'Invoices', function: createDefaultInvoices },
];

/**
 * Runs all seed steps in order
 */
export async function runDatabaseSeed() {
    logger.info('[DATABASE] Starting database seeding...');

    for (const step of SEED_STEPS) {
        try {
            logger.info(`[DATABASE] Running seed: ${step.name}...`);
            await step.function();
        } catch (error) {
            logger.error(error, `[DATABASE] Seed failed: ${step.name}`);
            throw error; // Re-throw to stop execution or handle as needed
        }
    }

    logger.info('[DATABASE] Database seeding completed successfully.');
}
