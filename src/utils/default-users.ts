import 'dotenv/config';
import { getDatabase } from '../database/client';
import { DB_TYPE } from '../database/config';
import { PostgresUserRepository } from '../repository/postgres/postgres-user.repository';
import { InMemoryUserRepository } from '../repository/memory/in-memory-user.repository';

export async function seedUsers() {
    const db = getDatabase();
    const userRepo = DB_TYPE === 'postgres' ? new PostgresUserRepository(db) : new InMemoryUserRepository(db);

    const demoUsers = [
        {
            email: 'john.doe@example.com',
            password: 'Password123!',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+33612345678',
            address: '123 Rue de la Paix',
            city: 'Paris',
            postalCode: '75001',
            country: 'FR',
            dateOfBirth: '1985-03-15',
            paymentMethod: { type: 'CARD', cardLast4: '4242' },
        },
        {
            email: 'jane.roux@example.com',
            password: 'Password123!',
            firstName: 'Jane',
            lastName: 'Roux',
            phone: '+33698765432',
            address: '45 Avenue des Champs-Élysées',
            city: 'Paris',
            postalCode: '75008',
            country: 'FR',
            dateOfBirth: '1990-07-22',
            paymentMethod: { type: 'SEPA', iban: 'FR76****************1234' },
        },
    ] as const;

    for (const u of demoUsers) {
        const exists = await userRepo.findByEmail(u.email);
        if (exists) {
            console.log(`ℹ️ User exists: ${u.email}`);
            continue;
        }

        await userRepo.create({
            email: u.email,
            password: u.password,
            firstName: u.firstName,
            lastName: u.lastName,
            phone: u.phone,
            address: u.address,
            city: u.city,
            postalCode: u.postalCode,
            country: u.country,
            dateOfBirth: u.dateOfBirth,
            paymentMethod: u.paymentMethod as any,
        });

        console.log(`User created: ${u.email}`);
    }
}

export async function createDefaultUsers() {
    await seedUsers();
    console.log('Default users created!');
}
