import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryInvoiceRepository } from '../../src/repository/memory/in-memory-invoice.repository';
import { InMemorySubscriptionRepository } from '../../src/repository/memory/in-memory-subscription.repository';
import { createBillingHandlers } from '../../src/handler/admin/billing';
import { createTestDatabase } from '../../src/database/memory/test-instance';
import type { SubscriptionRepository } from '../../src/repository/subscription.repository';
import type { InvoiceRepository } from '../../src/repository/invoice.repository';

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
    let billingHandlers: ReturnType<typeof createBillingHandlers>;

    beforeEach(() => {
        // Initialize DB and Repositories
        const db = createTestDatabase([]); // Start with empty DB
        subscriptionRepo = new InMemorySubscriptionRepository(db);
        invoiceRepo = new InMemoryInvoiceRepository(db);
        
        billingHandlers = createBillingHandlers(invoiceRepo, subscriptionRepo);
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
                promoCode: 'DISCOUNT'
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
            expect(inv2.amountExclVat).toBe(200);
            expect(inv2.vatAmount).toBe(40);
            expect(inv2.amountInclVat).toBe(240);

            // 5. Verify Persistence
            const storedInvoices = await invoiceRepo.findAllByDate(billingDate);
            expect(storedInvoices).toHaveLength(2);
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
});
