import 'dotenv/config';
import { getDatabase } from '../database/client';
import { DB_TYPE } from '../database/config';
import { logger } from './logger';

import { PostgresUserRepository } from '../repository/postgres/postgres-user.repository';
import { InMemoryUserRepository } from '../repository/memory/in-memory-user.repository';

import { PostgresSubscriptionRepository } from '../repository/postgres/postgres-subscription.repository';
import { InMemorySubscriptionRepository } from '../repository/memory/in-memory-subscription.repository';

import { PostgresInvoiceRepository } from '../repository/postgres/postgres-invoice.repository';
import { InMemoryInvoiceRepository } from '../repository/memory/in-memory-invoice.repository';

// ---- Types (minimal, sans dépendre de tes entités internes) ----
type InvoiceStatus = 'PAID' | 'SENT' | 'PENDING' | 'FAILED';

type UserLike = {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
};

type SubscriptionLike = {
    id: string;
    monthlyAmount?: number | null;
};

type InvoiceLike = {
    id?: string;
    billingDate: string;
};

type InvoiceCreateInput = {
    invoiceRef: string;
    userId: string;
    subscriptionId: string;
    billingDate: string;
    periodStart: string;
    periodEnd: string;
    amountExclVat: number;
    vatAmount: number;
    amountInclVat: number;
    status: InvoiceStatus;
};

// ---- Helpers ----
function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

// fin de mois: YYYY-MM-<lastDay> (m = 1..12)
function endOfMonth(y: number, m: number): string {
    const last = new Date(y, m, 0).getDate();
    return `${y}-${pad2(m)}-${pad2(last)}`;
}

function startOfMonth(y: number, m: number): string {
    return `${y}-${pad2(m)}-01`;
}

function computeAmounts(monthlyInclVat: number): {
    amountExclVat: number;
    vatAmount: number;
    amountInclVat: number;
} {
    // TVA 20%: incl = excl * 1.2 => excl = incl / 1.2
    const excl = Math.round((monthlyInclVat / 1.2) * 100) / 100;
    const vat = Math.round((monthlyInclVat - excl) * 100) / 100;
    return { amountExclVat: excl, vatAmount: vat, amountInclVat: monthlyInclVat };
}

function statusForIndex(i: number): InvoiceStatus {
    const cycle: readonly InvoiceStatus[] = ['PAID', 'PAID', 'SENT', 'PENDING', 'FAILED'];

    return cycle[i % cycle.length] ?? 'PAID';
}
function safeUpper(v?: string | null): string {
    return (v ?? '').trim().toUpperCase();
}

// ---- Seed ----
export async function seedInvoices(): Promise<void> {
    const db = getDatabase();

    const userRepo = DB_TYPE === 'postgres' ? new PostgresUserRepository(db) : new InMemoryUserRepository(db);

    const subRepo =
        DB_TYPE === 'postgres' ? new PostgresSubscriptionRepository(db) : new InMemorySubscriptionRepository(db);

    const invoiceRepo = DB_TYPE === 'postgres' ? new PostgresInvoiceRepository(db) : new InMemoryInvoiceRepository(db);

    // On caste en "Like" pour satisfaire TS sans dépendre de tes classes exactes
    const john = (await (userRepo as any).findByEmail('john.doe@example.com')) as UserLike | null;
    if (!john?.id) {
        logger.warn('John not found (or no id), run seedUsers first');
        return;
    }

    const subs = (await (subRepo as any).findAll({ userId: john.id })) as SubscriptionLike[];
    if (!subs.length) {
        logger.warn('No subscription found for John, run seedSubscriptions first');
        return;
    }

    // Paramètres
    const monthsToCreate: number = 8;
    const startYear: number = 2025;
    const startMonth: number = 7; // 07 => juillet 2025

    const factors: number[] = [1, 1, 1.1, 0.9, 1.2, 1, 0.95, 1.05];

    for (const sub of subs) {
        if (!sub?.id) continue;

        const existing = (await (invoiceRepo as any).findAll({ subscriptionId: sub.id })) as InvoiceLike[];
        const existingBillingDates = new Set<string>(existing.map((i) => i.billingDate));

        const baseInclVat: number =
            typeof sub.monthlyAmount === 'number' ? Math.round(sub.monthlyAmount * 100) / 100 : 15.0;

        for (let i = 0; i < monthsToCreate; i++) {
            const d = new Date(startYear, startMonth - 1 + i, 1);
            const y: number = d.getFullYear();
            const m: number = d.getMonth() + 1;

            const periodStart: string = startOfMonth(y, m);
            const periodEnd: string = endOfMonth(y, m);
            const billingDate: string = periodEnd;

            if (existingBillingDates.has(billingDate)) continue;

            const factor: number = factors[i % factors.length] ?? 1;
            const incl: number = Math.round(baseInclVat * factor * 100) / 100;

            const { amountExclVat, vatAmount, amountInclVat } = computeAmounts(incl);
            const status: InvoiceStatus = statusForIndex(i);

            const first = safeUpper(john.firstName) || 'JOHN';
            const subShort = String(sub.id).slice(0, 6);
            const invoiceRef: string = `INV-${y}-${pad2(m)}-${first}-${subShort}`;

            const payload: InvoiceCreateInput = {
                invoiceRef,
                userId: john.id,
                subscriptionId: sub.id,
                billingDate,
                periodStart,
                periodEnd,
                amountExclVat,
                vatAmount,
                amountInclVat,
                status,
            };

            await (invoiceRepo as any).create(payload);
            existingBillingDates.add(billingDate);
        }

        logger.info(`Invoices seeded for subscription ${sub.id}`);
    }

    logger.info('✅ Invoice seeding done');
}

export async function createDefaultInvoices(): Promise<void> {
    await seedInvoices();
    logger.info('Default invoices creation check complete');
}
