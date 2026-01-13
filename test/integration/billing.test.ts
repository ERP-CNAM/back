import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryInvoiceRepository } from '../../src/repository/memory/in-memory-invoice.repository';
import { InMemorySubscriptionRepository } from '../../src/repository/memory/in-memory-subscription.repository';
import { InMemoryUserRepository } from '../../src/repository/memory/in-memory-user.repository';
import { createBillingHandlers } from '../../src/handler/admin/billing';
import { createTestDatabase } from '../../src/database/memory/test-instance';
import type { SubscriptionRepository } from '../../src/repository/subscription.repository';
import type { InvoiceRepository } from '../../src/repository/invoice.repository';
import type { UserRepository } from '../../src/repository/user.repository';

// Mock response object
const createMockResponse = () => {
    return {
        with200: () => ({
            body: (payload: any) => ({ status: 200, body: payload }),
        }),
        with400: () => ({
            body: (payload: any) => ({ status: 400, body: payload }),
        }),
        with500: () => ({
            body: (payload: any) => ({ status: 500, body: payload }),
        }),
    } as any;
};

describe('Billing Integration', () => {
    let invoiceRepo: InvoiceRepository;
    let subscriptionRepo: SubscriptionRepository;
    let userRepo: UserRepository;
    let billingHandlers: ReturnType<typeof createBillingHandlers>;

    beforeEach(() => {
        // Initialize DB and Repositories
        const db = createTestDatabase([]); // Start with empty DB
        subscriptionRepo = new InMemorySubscriptionRepository(db);
        invoiceRepo = new InMemoryInvoiceRepository(db);
        userRepo = new InMemoryUserRepository(db);
        
        billingHandlers = createBillingHandlers(invoiceRepo, subscriptionRepo, userRepo);
    });

    describe('generateMonthlyBilling', () => {
        it('should generate invoices for active subscriptions', async () => {
            // 1. Setup Data: Create active and inactive subscriptions
            const activeSub1 = await subscriptionRepo.create({
                userId: 'user-1',
                contractCode: 'C001',
                startDate: '2025-01-01',
                monthlyAmount: 100,
                promoCode: null
            });

            const activeSub2 = await subscriptionRepo.create({
                userId: 'user-2',
                contractCode: 'C002',
                startDate: '2025-02-01',
                monthlyAmount: 200,
                promoCode: 'B1M20'
            });

            const cancelledSub = await subscriptionRepo.create({
                userId: 'user-3',
                contractCode: 'C003',
                startDate: '2025-01-01',
                monthlyAmount: 50,
                promoCode: null
            });
            await subscriptionRepo.cancel(cancelledSub.id!); // Assuming ID is returned

            // 2. Execute Handler
            const billingDate = '2026-03-31';
            const params = { body: { billingDate } } as any;
            const respond = createMockResponse();

            const result = await billingHandlers.generateMonthlyBilling(params, respond, {} as any, {} as any, {} as any);

            // 3. Verify Response
            expect(result.status).toBe(200);
            expect(result.body.success).toBe(true);
            
            const payload = result.body.payload;
            expect(payload.billingDate).toBe(billingDate);
            expect(payload.invoices).toHaveLength(2); // Only active subscriptions

            // 4. Verify Calculations
            const inv1 = payload.invoices.find((i: any) => i.subscriptionId === activeSub1.id);
            expect(inv1).toBeDefined();
            expect(inv1.amountExclVat).toBe(100);
            expect(inv1.vatAmount).toBe(20); // 20% of 100
            expect(inv1.amountInclVat).toBe(120);
            expect(inv1.invoiceRef).toMatch(/^INV-2026-03-C001$/); // Verify Ref format

            const inv2 = payload.invoices.find((i: any) => i.subscriptionId === activeSub2.id);
            expect(inv2).toBeDefined();
            expect(inv2.amountExclVat).toBe(100); // 200 * 0.5 (First month promo)
            expect(inv2.vatAmount).toBe(20);
            expect(inv2.amountInclVat).toBe(120);

            // 5. Verify Persistence
            const storedInvoices = await invoiceRepo.findAllByDate(billingDate);
            expect(storedInvoices).toHaveLength(2);
        });

        it('should apply 50% discount on first billing with promo code', async () => {
            // Setup: Subscription with promo code
            const subWithPromo = await subscriptionRepo.create({
                userId: 'user-promo',
                contractCode: 'PROMO1',
                startDate: '2026-01-01',
                monthlyAmount: 100,
                promoCode: 'B1M20'
            });

            const billingDate = '2026-01-31';
            const params = { body: { billingDate } } as any;
            const respond = createMockResponse();

            // 1st Billing Run
            const result1 = await billingHandlers.generateMonthlyBilling(params, respond, {} as any, {} as any, {} as any);
            
            const invoice1 = result1.body.payload.invoices[0];
            expect(invoice1.amountExclVat).toBe(50); // 100 * 0.5
            expect(invoice1.amountInclVat).toBe(60); // 50 + 20%

            // 2nd Billing Run (Next Month)
            const billingDate2 = '2026-02-28';
            const params2 = { body: { billingDate: billingDate2 } } as any;
            
            const result2 = await billingHandlers.generateMonthlyBilling(params2, respond, {} as any, {} as any, {} as any);
            
            const invoice2 = result2.body.payload.invoices.find((i: any) => i.subscriptionId === subWithPromo.id);
            expect(invoice2.amountExclVat).toBe(100); // Full price
            expect(invoice2.amountInclVat).toBe(120);
        });

        it('should handle no active subscriptions gracefully', async () => {
            const billingDate = '2026-03-31';
            const params = { body: { billingDate } } as any;
            const respond = createMockResponse();

            const result = await billingHandlers.generateMonthlyBilling(params, respond, {} as any, {} as any, {} as any);

            expect(result.status).toBe(200);
            expect(result.body.payload.invoices).toHaveLength(0);
        });
    });

    describe('exportMonthlyInvoices', () => {
        it('should generate accounting lines for a given month', async () => {
            // 1. Setup: Create User and Invoice
            const user = await userRepo.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: 'pass',
            });

            await invoiceRepo.create({
                invoiceRef: 'INV-TEST',
                subscriptionId: 'sub-1',
                userId: user.id!,
                billingDate: '2026-06-30',
                periodStart: '2026-06-01',
                periodEnd: '2026-06-30',
                amountExclVat: 100,
                vatAmount: 20,
                amountInclVat: 120,
                status: 'PENDING'
            });

            // 2. Execute
            const params = { query: { billingMonth: '2026-06' } } as any;
            const respond = createMockResponse();
            const result = await billingHandlers.exportMonthlyInvoices(params, respond, {} as any, {} as any, {} as any);

            // 3. Verify
            expect(result.status).toBe(200);
            const lines = result.body.payload;
            expect(lines).toHaveLength(3);

            // Verify Client Line
            const clientLine = lines.find((l: any) => l.generalAccount === '411');
            expect(clientLine).toBeDefined();
            expect(clientLine.debit).toBe(120);
            expect(clientLine.clientAccount).toBe('AUX_DOE');
            expect(clientLine.customerName).toBe('John Doe');

            // Verify Product Line
            const productLine = lines.find((l: any) => l.generalAccount === '706');
            expect(productLine.credit).toBe(100);

            // Verify VAT Line
            const vatLine = lines.find((l: any) => l.generalAccount === '445');
            expect(vatLine.credit).toBe(20);
        });
    });
});
