import { describe, it, expect, beforeEach } from 'vitest';
import { ExpressRuntimeResponse, SkipResponse } from '@nahkies/typescript-express-runtime/server';
import { InMemoryInvoiceRepository } from '../../src/repository/memory/in-memory-invoice.repository';
import { InMemoryUserRepository } from '../../src/repository/memory/in-memory-user.repository';
import { createReportHandlers } from '../../src/handler/admin/report';
import { createTestDatabase } from '../../src/database/memory/test-instance';
import type { InvoiceRepository } from '../../src/repository/invoice.repository';
import type { UserRepository } from '../../src/repository/user.repository';
import type { t_BaseAPIResponse, t_DirectDebitOrder } from '../../api/models';

// Mock response object
const createMockResponse = () => {
    return {
        with200: () => new ExpressRuntimeResponse(200),
        with400: () => new ExpressRuntimeResponse(400),
        with500: () => new ExpressRuntimeResponse(500),
    } as any;
};

describe('Banking Integration', () => {
    let invoiceRepo: InvoiceRepository;
    let userRepo: UserRepository;
    let reportHandlers: ReturnType<typeof createReportHandlers>;

    beforeEach(() => {
        const db = createTestDatabase([]);
        invoiceRepo = new InMemoryInvoiceRepository(db);
        userRepo = new InMemoryUserRepository(db);

        reportHandlers = createReportHandlers(invoiceRepo, userRepo);
    });

    describe('exportDirectDebits', () => {
        it('should generate direct debit orders for eligible pending invoices', async () => {
            // 1. Setup Users
            const userWithSepa = await userRepo.create({
                firstName: 'Alice',
                lastName: 'Sepa',
                email: 'alice@example.com',
                password: 'pass',
                address: '123 Test St',
                city: 'Paris',
                country: 'FR',
                phone: '+33123456789',
                postalCode: '75001',
                paymentMethod: { type: 'SEPA', iban: 'FR76...' },
            });

            const userNoPayment = await userRepo.create({
                firstName: 'Bob',
                lastName: 'NoPay',
                email: 'bob@example.com',
                password: 'pass',
                address: '456 Test Ave',
                city: 'Lyon',
                country: 'FR',
                phone: '+33987654321',
                postalCode: '69001',
                // No payment method
            });

            // 2. Setup Invoices (for previous month relative to execution date)
            // Execution: 2026-07-01 -> Billing Month: 2026-06
            const billingMonth = '2026-06';

            // Invoice 1: Eligible
            await invoiceRepo.create({
                invoiceRef: 'INV-1',
                subscriptionId: 'sub-1',
                userId: userWithSepa.id!,
                billingDate: '2026-06-30',
                periodStart: '2026-06-01',
                periodEnd: '2026-06-30',
                amountExclVat: 10,
                vatAmount: 2,
                amountInclVat: 12,
                status: 'PENDING',
            });

            // Invoice 2: Not Eligible (No Payment Method)
            await invoiceRepo.create({
                invoiceRef: 'INV-2',
                subscriptionId: 'sub-2',
                userId: userNoPayment.id!,
                billingDate: '2026-06-30',
                periodStart: '2026-06-01',
                periodEnd: '2026-06-30',
                amountExclVat: 10,
                vatAmount: 2,
                amountInclVat: 12,
                status: 'PENDING',
            });

            // Invoice 3: Wrong Month (May)
            await invoiceRepo.create({
                invoiceRef: 'INV-3',
                subscriptionId: 'sub-1',
                userId: userWithSepa.id!,
                billingDate: '2026-05-31',
                periodStart: '2026-05-01',
                periodEnd: '2026-05-31',
                amountExclVat: 10,
                vatAmount: 2,
                amountInclVat: 12,
                status: 'PENDING',
            });

            // 3. Execute
            const executionDate = '2026-07-01';
            const params = { query: { executionDate } } as any;
            const respond = createMockResponse();

            const response = await reportHandlers.exportDirectDebits(params, respond, {} as any, {} as any, {} as any);

            // 4. Verify
            if (response === SkipResponse) throw new Error('Response skipped');
            const result = response.unpack() as {
                status: number;
                body: t_BaseAPIResponse & { payload: t_DirectDebitOrder[] };
            };

            expect(result.status).toBe(200);
            const orders = result.body.payload!;

            // Should verify that we have exactly 1 order (Alice's June invoice)
            expect(orders).toHaveLength(1);

            const order = orders[0];
            expect(order.userId).toBe(userWithSepa.id);
            expect(order.amount).toBe(12);
            expect(order.status).toBe('TO_SEND');
            expect(order.executionDate).toBe(executionDate);
            expect(order.paymentMethod).toBe('SEPA');
        });
    });

    describe('updatePaymentStatus', () => {
        it('should mark invoice as PAID when payment is executed', async () => {
            // Setup
            const user = await userRepo.create({
                firstName: 'Good',
                lastName: 'Payer',
                email: 'good@example.com',
                password: 'pass',
                address: '789 Test Blvd',
                city: 'Marseille',
                country: 'FR',
                phone: '+33111222333',
                postalCode: '13001',
            });
            const invoice = await invoiceRepo.create({
                invoiceRef: 'INV-GOOD',
                subscriptionId: 'sub-1',
                userId: user.id!,
                billingDate: '2026-06-30',
                periodStart: '2026-06-01',
                periodEnd: '2026-06-30',
                amountExclVat: 10,
                vatAmount: 2,
                amountInclVat: 12,
                status: 'SENT',
            });

            // Execute Webhook
            const body = [{ invoiceId: invoice.id!, status: 'EXECUTED' }];
            const params = { body } as any;
            const respond = createMockResponse();

            await reportHandlers.updatePaymentStatus(params, respond, {} as any, {} as any, {} as any);

            // Verify
            const updatedInvoice = (await invoiceRepo.findAllByDate('2026-06-30')).find((i) => i.id === invoice.id);
            expect(updatedInvoice?.status).toBe('PAID');

            const updatedUser = await userRepo.findById(user.id!);
            expect(updatedUser?.status).toBe('OK'); // Should remain OK
        });

        it('should mark invoice as FAILED and suspend user when payment is rejected', async () => {
            // Setup
            const user = await userRepo.create({
                firstName: 'Bad',
                lastName: 'Payer',
                email: 'bad@example.com',
                password: 'pass',
                address: '321 Test Rd',
                city: 'Toulouse',
                country: 'FR',
                phone: '+33444555666',
                postalCode: '31000',
            });
            const invoice = await invoiceRepo.create({
                invoiceRef: 'INV-BAD',
                subscriptionId: 'sub-2',
                userId: user.id!,
                billingDate: '2026-06-30',
                periodStart: '2026-06-01',
                periodEnd: '2026-06-30',
                amountExclVat: 10,
                vatAmount: 2,
                amountInclVat: 12,
                status: 'SENT',
            });

            // Execute Webhook
            const body = [{ invoiceId: invoice.id!, status: 'REJECTED', rejectionReason: 'Insufficient funds' }];
            const params = { body } as any;
            const respond = createMockResponse();

            await reportHandlers.updatePaymentStatus(params, respond, {} as any, {} as any, {} as any);

            // Verify
            const updatedInvoice = (await invoiceRepo.findAllByDate('2026-06-30')).find((i) => i.id === invoice.id);
            expect(updatedInvoice?.status).toBe('FAILED');

            const updatedUser = await userRepo.findById(user.id!);
            expect(updatedUser?.status).toBe('SUSPENDED');
        });
    });
});
