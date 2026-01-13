import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryInvoiceRepository } from '../../src/repository/memory/in-memory-invoice.repository';
import { InMemoryUserRepository } from '../../src/repository/memory/in-memory-user.repository';
import { createReportHandlers } from '../../src/handler/admin/report';
import { createTestDatabase } from '../../src/database/memory/test-instance';
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

describe('Reporting Integration', () => {
    let invoiceRepo: InvoiceRepository;
    let userRepo: UserRepository;
    let reportHandlers: ReturnType<typeof createReportHandlers>;

    beforeEach(() => {
        const db = createTestDatabase([]); 
        invoiceRepo = new InMemoryInvoiceRepository(db);
        userRepo = new InMemoryUserRepository(db);
        reportHandlers = createReportHandlers(invoiceRepo, userRepo);
    });

    describe('getMonthlyRevenue', () => {
        it('should aggregate revenue by month within the specified range', async () => {
            const userId = 'user-1';

            // Jan Invoice 1: 100 HT
            await invoiceRepo.create({
                invoiceRef: 'INV-JAN-1',
                subscriptionId: 'sub-1',
                userId,
                billingDate: '2026-01-31',
                periodStart: '2026-01-01',
                periodEnd: '2026-01-31',
                amountExclVat: 100,
                vatAmount: 20,
                amountInclVat: 120,
                status: 'PAID'
            });

            // Jan Invoice 2: 50 HT
            await invoiceRepo.create({
                invoiceRef: 'INV-JAN-2',
                subscriptionId: 'sub-2',
                userId,
                billingDate: '2026-01-31',
                periodStart: '2026-01-01',
                periodEnd: '2026-01-31',
                amountExclVat: 50,
                vatAmount: 10,
                amountInclVat: 60,
                status: 'PAID'
            });

            // Feb Invoice: 200 HT
            await invoiceRepo.create({
                invoiceRef: 'INV-FEB-1',
                subscriptionId: 'sub-1',
                userId,
                billingDate: '2026-02-28',
                periodStart: '2026-02-01',
                periodEnd: '2026-02-28',
                amountExclVat: 200,
                vatAmount: 40,
                amountInclVat: 240,
                status: 'PAID'
            });

            // Mar Invoice: Should be excluded
            await invoiceRepo.create({
                invoiceRef: 'INV-MAR-1',
                subscriptionId: 'sub-1',
                userId,
                billingDate: '2026-03-31',
                periodStart: '2026-03-01',
                periodEnd: '2026-03-31',
                amountExclVat: 300,
                vatAmount: 60,
                amountInclVat: 360,
                status: 'PAID'
            });

            // Execute: Get Revenue for Jan & Feb
            const params = { query: { from: '2026-01', to: '2026-02' } } as any;
            const respond = createMockResponse();

            const result = await reportHandlers.getMonthlyRevenue(params, respond, {} as any, {} as any, {} as any);

            // Verify
            expect(result.status).toBe(200);
            const payload = result.body.payload;
            
            expect(payload).toHaveLength(2);
            
            // Verify Jan (Total 150 HT)
            const janStats = payload.find((s: any) => s.month === '2026-01');
            expect(janStats).toBeDefined();
            expect(janStats.revenueExclVat).toBe(150);
            expect(janStats.vatAmount).toBe(30);
            expect(janStats.revenueInclVat).toBe(180);

            // Verify Feb (Total 200 HT)
            const febStats = payload.find((s: any) => s.month === '2026-02');
            expect(febStats).toBeDefined();
            expect(febStats.revenueExclVat).toBe(200);

            // Verify Mar is missing
            const marStats = payload.find((s: any) => s.month === '2026-03');
            expect(marStats).toBeUndefined();
        });
    });
});
