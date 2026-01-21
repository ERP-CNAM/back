import { describe, it, expect, beforeEach } from 'vitest';
import { ExpressRuntimeResponse, SkipResponse } from '@nahkies/typescript-express-runtime/server';
import { InMemoryInvoiceRepository } from '../../src/repository/memory/in-memory-invoice.repository';
import { InMemorySubscriptionRepository } from '../../src/repository/memory/in-memory-subscription.repository';
import { InMemoryUserRepository } from '../../src/repository/memory/in-memory-user.repository';
import { createBillingHandlers } from '../../src/handler/admin/billing';
import { createTestDatabase } from '../../src/database/memory/test-instance';
import type { SubscriptionRepository } from '../../src/repository/subscription.repository';
import type { InvoiceRepository } from '../../src/repository/invoice.repository';
import type { UserRepository } from '../../src/repository/user.repository';
import type { t_BaseAPIResponse, t_InvoiceDetailed } from '../../api/models';
import { BillingService } from '../../src/service/billing.service';

// Mock response object
const createMockResponse = () => {
    return {
        with200: () => new ExpressRuntimeResponse(200),
        with400: () => new ExpressRuntimeResponse(400),
        with500: () => new ExpressRuntimeResponse(500),
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

        const billingService = new BillingService(invoiceRepo, subscriptionRepo, userRepo);

        billingHandlers = createBillingHandlers(billingService);
    });

    describe('generateMonthlyBilling', () => {
        it('should generate invoices for active subscriptions', async () => {
            // 1. Setup Data: Create users first (required for INNER JOIN)
            const user1 = await userRepo.create({
                firstName: 'User',
                lastName: 'One',
                email: 'user1@example.com',
                password: 'pass123',
                address: '123 Test St',
                city: 'Test City',
                country: 'France',
                phone: '+33123456789',
                postalCode: '75001',
            });
            const user2 = await userRepo.create({
                firstName: 'User',
                lastName: 'Two',
                email: 'user2@example.com',
                password: 'pass123',
                address: '456 Test Ave',
                city: 'Test City',
                country: 'France',
                phone: '+33123456790',
                postalCode: '75002',
            });
            const user3 = await userRepo.create({
                firstName: 'User',
                lastName: 'Three',
                email: 'user3@example.com',
                password: 'pass123',
                address: '789 Test Blvd',
                city: 'Test City',
                country: 'France',
                phone: '+33123456791',
                postalCode: '75003',
            });

            // Create active and inactive subscriptions
            const activeSub1 = await subscriptionRepo.create({
                userId: user1.id!,
                contractCode: 'C001',
                startDate: '2025-01-01',
                monthlyAmount: 100,
                promoCode: null,
            });

            const activeSub2 = await subscriptionRepo.create({
                userId: user2.id!,
                contractCode: 'C002',
                startDate: '2025-02-01',
                monthlyAmount: 200,
                promoCode: 'B1M20',
            });

            const cancelledSub = await subscriptionRepo.create({
                userId: user3.id!,
                contractCode: 'C003',
                startDate: '2025-01-01',
                monthlyAmount: 50,
                promoCode: null,
            });
            await subscriptionRepo.cancel(cancelledSub.id!); // Assuming ID is returned

            // 2. Execute Handler
            const billingDate = '2026-03-31';
            const params = { body: { billingDate } } as any;
            const respond = createMockResponse();

            const response = await billingHandlers.generateMonthlyBilling(
                params,
                respond,
                {} as any,
                {} as any,
                {} as any,
            );

            // 3. Verify Response
            if (response === SkipResponse) {
                throw new Error('Response was skipped');
            }
            const { status, body } = response.unpack() as {
                status: number;
                body: t_BaseAPIResponse & { payload: { billingDate: string; invoices: t_InvoiceDetailed[] } };
            };

            expect(status).toBe(200);
            expect(body.success).toBe(true);

            const payload = body.payload;
            expect(payload.billingDate).toBe(billingDate);
            expect(payload.invoices).toHaveLength(2); // Only active subscriptions

            // 4. Verify Calculations
            const inv1 = payload.invoices.find((i: any) => i.subscriptionId === activeSub1.id);
            expect(inv1).toBeDefined();
            expect(inv1!.amountExclVat).toBe(100);
            expect(inv1!.vatAmount).toBe(20); // 20% of 100
            expect(inv1!.amountInclVat).toBe(120);
            expect(inv1!.invoiceRef).toMatch(/^INV-2026-03-C001$/); // Verify Ref format

            const inv2 = payload.invoices.find((i: any) => i.subscriptionId === activeSub2.id);
            expect(inv2).toBeDefined();
            expect(inv2!.amountExclVat).toBe(100); // 200 * 0.5 (First month promo)
            expect(inv2!.vatAmount).toBe(20);
            expect(inv2!.amountInclVat).toBe(120);

            // 5. Verify Persistence
            const storedInvoices = await invoiceRepo.findAllByDate(billingDate);
            expect(storedInvoices).toHaveLength(2);
        });

        it('should apply 50% discount on first billing with promo code', async () => {
            // Setup: Create user first (required for INNER JOIN)
            const userPromo = await userRepo.create({
                firstName: 'Promo',
                lastName: 'User',
                email: 'promo@example.com',
                password: 'pass123',
                address: '100 Promo St',
                city: 'Promo City',
                country: 'France',
                phone: '+33198765432',
                postalCode: '69001',
            });

            // Create subscription with promo code
            const subWithPromo = await subscriptionRepo.create({
                userId: userPromo.id!,
                contractCode: 'PROMO1',
                startDate: '2026-01-01',
                monthlyAmount: 100,
                promoCode: 'B1M20',
            });

            const billingDate = '2026-01-31';
            const params = { body: { billingDate } } as any;
            const respond = createMockResponse();

            // 1st Billing Run
            const response1 = await billingHandlers.generateMonthlyBilling(
                params,
                respond,
                {} as any,
                {} as any,
                {} as any,
            );

            if (response1 === SkipResponse) throw new Error('Response skipped');
            const result1 = response1.unpack() as {
                status: number;
                body: t_BaseAPIResponse & { payload: { invoices: t_InvoiceDetailed[] } };
            };

            const invoice1 = result1.body.payload.invoices[0];
            expect(invoice1.amountExclVat).toBe(50); // 100 * 0.5
            expect(invoice1.amountInclVat).toBe(60); // 50 + 20%

            // 2nd Billing Run (Next Month)
            const billingDate2 = '2026-02-28';
            const params2 = { body: { billingDate: billingDate2 } } as any;

            const response2 = await billingHandlers.generateMonthlyBilling(
                params2,
                respond,
                {} as any,
                {} as any,
                {} as any,
            );

            if (response2 === SkipResponse) throw new Error('Response skipped');
            const result2 = response2.unpack() as {
                status: number;
                body: t_BaseAPIResponse & { payload: { invoices: t_InvoiceDetailed[] } };
            };

            const invoice2 = result2.body.payload.invoices.find((i: any) => i.subscriptionId === subWithPromo.id);
            expect(invoice2).toBeDefined();
            expect(invoice2!.amountExclVat).toBe(100); // Full price
            expect(invoice2!.amountInclVat).toBe(120);
        });

        it('should handle no active subscriptions gracefully', async () => {
            const billingDate = '2026-03-31';
            const params = { body: { billingDate } } as any;
            const respond = createMockResponse();

            const response = await billingHandlers.generateMonthlyBilling(
                params,
                respond,
                {} as any,
                {} as any,
                {} as any,
            );

            if (response === SkipResponse) throw new Error('Response skipped');
            const result = response.unpack() as {
                status: number;
                body: t_BaseAPIResponse & { payload: { invoices: t_InvoiceDetailed[] } };
            };

            expect(result.status).toBe(200);
            expect(result.body.payload.invoices).toHaveLength(0);
        });
    });
});
