import 'dotenv/config';
import { getDatabase } from '../database/client';
import { DB_TYPE } from '../database/config';
import { PostgresAdminRepository } from '../repository/postgres/postgres-admin.repository';
import { InMemoryAdminRepository } from '../repository/memory/in-memory-admin.repository';

/**
 * Script to create an initial admin user (dev only)
 */
async function generateAdmin() {
    try {
        const db = getDatabase();
        const adminRepo = DB_TYPE === 'postgres' ? new PostgresAdminRepository(db) : new InMemoryAdminRepository(db);

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@gamers-erp.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
        const firstName = process.env.ADMIN_FIRSTNAME || 'Super';
        const lastName = process.env.ADMIN_LASTNAME || 'Admin';

        // Check if admin already exists
        const existingAdmin = await adminRepo.findByEmail(adminEmail);
        if (existingAdmin) {
            console.error(`Admin with email ${adminEmail} already exists`);
            return;
        }

        // Create admin
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

export function addAdmin() {
    if (process.env.NODE_ENV !== 'production') {
        generateAdmin().then(() => console.log('Admin created!'));
    }
}
