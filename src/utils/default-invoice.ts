import 'dotenv/config';
import { getDatabase } from '../database/client';
import { DB_TYPE } from '../database/config';

import { PostgresUserRepository } from '../repository/postgres/postgres-user.repository';
import { InMemoryUserRepository } from '../repository/memory/in-memory-user.repository';

import { PostgresSubscriptionRepository } from '../repository/postgres/postgres-subscription.repository';
import { InMemorySubscriptionRepository } from '../repository/memory/in-memory-subscription.repository';

import { PostgresInvoiceRepository } from '../repository/postgres/postgres-invoice.repository';
import { InMemoryInvoiceRepository } from '../repository/memory/in-memory-invoice.repository';

export async function seedInvoices() {
    const db = getDatabase();

    const userRepo = DB_TYPE === 'postgres' ? new PostgresUserRepository(db) : new InMemoryUserRepository(db);

    const subRepo =
        DB_TYPE === 'postgres' ? new PostgresSubscriptionRepository(db) : new InMemorySubscriptionRepository(db);

    const invoiceRepo = DB_TYPE === 'postgres' ? new PostgresInvoiceRepository(db) : new InMemoryInvoiceRepository(db);

    // 1️⃣ John
    const john = await userRepo.findByEmail('john.doe@example.com');
    if (!john) {
        console.log('John not found, run seedUsers first');
        return;
    }
    if (!john.id) {
        throw new Error('John has no id');
    }

    // 2️⃣ Abonnement
    const subs = await subRepo.findAll({ userId: john.id });
    if (!subs.length) {
        console.log('No subscription found for John, run seedSubscriptions first');
        return;
    }

    const sub = subs[0];

    if (!sub?.id) {
        throw new Error('Subscription has no id');
    }

    // 3️⃣ Vérifier si facture existe déjà (ex: Janvier 2026)
    const billingDate = '2026-01-31';

    const existing = await invoiceRepo.findAll({
        subscriptionId: sub.id,
    });

    const alreadyExists = existing.some((i) => i.billingDate === billingDate);

    if (alreadyExists) {
        console.log('ℹ Invoice already exists for this subscription');
        return;
    }

    // 4️⃣ Création facture
    await invoiceRepo.create({
        invoiceRef: 'INV-2026-01-JOHN',
        userId: john.id,
        subscriptionId: sub.id,
        billingDate,
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
        amountExclVat: 12.0,
        vatAmount: 3.0,
        amountInclVat: 15.0,
        status: 'PAID',
    });

    console.log('Invoice created for John');
}

export async function createDefaultInvoices() {
    await seedInvoices();
    console.log('Default invoices created!');
}
