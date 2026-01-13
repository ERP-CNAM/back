import 'dotenv/config';
import { getDatabase } from '../database/client';
import { DB_TYPE } from '../database/config';
import { PostgresAdminRepository } from '../repository/postgres/postgres-admin.repository';
import { InMemoryAdminRepository } from '../repository/memory/in-memory-admin.repository';

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
            console.error(`Admin with email ${adminEmail} already exists`);
            return;
        }

        const admin = await adminRepo.create({
            email: adminEmail,
            password: adminPassword,
            firstName: firstName,
            lastName: lastName,
        });

        console.log('Email:', admin.email);
        console.log('Password:', adminPassword);
        console.log('Name:', `${admin.firstName} ${admin.lastName}`);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

export async function createDefaultAdmin() {
    if (process.env.NODE_ENV === 'production') return;
    await seedAdmin();
    console.log('Default admin created!');
}

