import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoiceService } from '../../../src/service/invoice.service';
import type { InvoiceRepository } from '../../../src/repository/invoice.repository';
import type { SubscriptionRepository } from '../../../src/repository/subscription.repository';
import type { UserRepository } from '../../../src/repository/user.repository';

describe('InvoiceService', () => {
    let service: InvoiceService;
    let invoiceRepo: InvoiceRepository;
    let subscriptionRepo: SubscriptionRepository;
    let userRepo: UserRepository;

    beforeEach(() => {
        invoiceRepo = { findAll: vi.fn() } as unknown as InvoiceRepository;
        subscriptionRepo = { findById: vi.fn() } as unknown as SubscriptionRepository;
        userRepo = { findById: vi.fn() } as unknown as UserRepository;

        service = new InvoiceService(invoiceRepo, subscriptionRepo, userRepo);
    });

    describe('listInvoices', () => {
        it('should return empty list if no invoices found', async () => {
            vi.mocked(invoiceRepo.findAll).mockResolvedValue([]);

            const result = await service.listInvoices({});

            expect(result).toEqual([]);
            expect(userRepo.findById).not.toHaveBeenCalled();
            expect(subscriptionRepo.findById).not.toHaveBeenCalled();
        });

        it('should fetch related data (N+1 optimization)', async () => {
            // Setup Invoices
            const invoices = [
                { id: 'i1', userId: 'u1', subscriptionId: 's1', amountExclVat: 100 },
                { id: 'i2', userId: 'u1', subscriptionId: 's2', amountExclVat: 200 }, // Same user, diff sub
            ];
            vi.mocked(invoiceRepo.findAll).mockResolvedValue(invoices as any);

            // Setup Related Data Mocks
            vi.mocked(userRepo.findById).mockImplementation(async (id) => ({ id, email: `user-${id}@test.com` } as any));
            vi.mocked(subscriptionRepo.findById).mockImplementation(async (id) => ({ id, status: 'ACTIVE' } as any));

            // Execute
            const result = await service.listInvoices({});

            // Verify result structure
            expect(result).toHaveLength(2);
            expect(result[0].subscription).toBeDefined();
            expect(result[0].subscription?.user).toBeDefined();
            expect(result[0].subscription?.id).toBe('s1');
            expect(result[0].subscription?.user?.id).toBe('u1');

            // Verify efficiency (findById called only once per unique ID)
            expect(userRepo.findById).toHaveBeenCalledTimes(1); // Only 'u1'
            expect(userRepo.findById).toHaveBeenCalledWith('u1');

            expect(subscriptionRepo.findById).toHaveBeenCalledTimes(2); // 's1' and 's2'
            expect(subscriptionRepo.findById).toHaveBeenCalledWith('s1');
            expect(subscriptionRepo.findById).toHaveBeenCalledWith('s2');
        });

        it('should handles missing related data gracefully', async () => {
            const invoices = [
                { id: 'i1', userId: 'u1', subscriptionId: 's1' },
            ];
            vi.mocked(invoiceRepo.findAll).mockResolvedValue(invoices as any);

            // Mock Repos returning null (data inconsistency case)
            vi.mocked(userRepo.findById).mockResolvedValue(null);
            vi.mocked(subscriptionRepo.findById).mockResolvedValue(null);

            const result = await service.listInvoices({});

            expect(result[0].subscription).toBeUndefined(); // Should be undefined if sub missing
        });
    });
});
