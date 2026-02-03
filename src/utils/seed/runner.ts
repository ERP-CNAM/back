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

    const seedInvoiceSubscriptionEnabled = process.env.SEED_INVOICE_SUBSCRIPTION_ENABLED === 'true';

    const filteredSteps = seedInvoiceSubscriptionEnabled
        ? SEED_STEPS
        : SEED_STEPS.filter((step) => step.name !== 'Subscriptions' && step.name !== 'Invoices');

    for (const step of filteredSteps) {
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
