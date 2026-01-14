import 'dotenv/config';
import { getDatabase } from '../database/client';
import { DB_TYPE } from '../database/config';
import { PostgresAdminRepository } from '../repository/postgres/postgres-admin.repository';
import { InMemoryAdminRepository } from '../repository/memory/in-memory-admin.repository';
import { logger } from './logger';

/**
 * Script to create an initial admin user (dev only)
 */
async function seedAdmin() {
    try {
        const db = getDatabase();
        const adminRepo = DB_TYPE === 'postgres' ? new PostgresAdminRepository(db) : new InMemoryAdminRepository(db);

        const adminEmail = String(process.env.ADMIN_EMAIL);
        const adminPassword = String(process.env.ADMIN_PASSWORD);
        const firstName = String(process.env.ADMIN_FIRSTNAME);
        const lastName = String(process.env.ADMIN_LASTNAME);

        const existingAdmin = await adminRepo.findByEmail(adminEmail);
        if (existingAdmin) {
            logger.warn(`Admin with email ${adminEmail} already exists`);
            return;
        }

        const admin = await adminRepo.create({
            email: adminEmail,
            password: adminPassword,
            firstName: firstName,
            lastName: lastName,
        });

        logger.info({ email: admin.email, name: `${admin.firstName} ${admin.lastName}` }, 'Admin created details');
    } catch (error) {
        logger.error(error, 'Error creating admin');
        process.exit(1);
    }
}

export async function createDefaultAdmin() {
    await seedAdmin();
    logger.info('Default admin creation check complete');
}
