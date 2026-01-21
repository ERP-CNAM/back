import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingService } from '../../../src/service/billing.service';
import type { InvoiceRepository } from '../../../src/repository/invoice.repository';
import type { SubscriptionRepository } from '../../../src/repository/subscription.repository';
import type { UserRepository } from '../../../src/repository/user.repository';

describe('BillingService', () => {
    let service: BillingService;
    let invoiceRepo: InvoiceRepository;
    let subscriptionRepo: SubscriptionRepository;
    let userRepo: UserRepository;

    beforeEach(() => {
        invoiceRepo = {
            create: vi.fn(),
            countBySubscriptionId: vi.fn(),
            updateStatus: vi.fn(),
        } as unknown as InvoiceRepository;
        subscriptionRepo = { findAll: vi.fn() } as unknown as SubscriptionRepository;
        userRepo = {
            findById: vi.fn(),
            updateStatus: vi.fn(),
        } as unknown as UserRepository;

        service = new BillingService(invoiceRepo, subscriptionRepo, userRepo);
    });

    describe('generateMonthlyBilling', () => {
        it('should generate invoices for active subscriptions with correct VAT', async () => {
            const subs = [{ id: 's1', userId: 'u1', monthlyAmount: 100, status: 'ACTIVE', startDate: '2023-01-01' }];
            vi.mocked(subscriptionRepo.findAll).mockResolvedValue(subs as any);
            vi.mocked(invoiceRepo.create).mockResolvedValue({ id: 'inv-1' } as any);

            const result = await service.generateMonthlyBilling('2023-01-01');

            expect(result.invoices).toHaveLength(1);
            expect(invoiceRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    amountExclVat: 100,
                    vatAmount: 20, // 20%
                    amountInclVat: 120,
                    subscriptionId: 's1',
                    userId: 'u1',
                }),
            );
        });

        it('should apply B1M20 promo code (50% off first month)', async () => {
            const subs = [{ id: 's1', userId: 'u1', monthlyAmount: 100, status: 'ACTIVE', promoCode: 'B1M20' }];
            vi.mocked(subscriptionRepo.findAll).mockResolvedValue(subs as any);
            // First invoice
            vi.mocked(invoiceRepo.countBySubscriptionId).mockResolvedValue(0);
            vi.mocked(invoiceRepo.create).mockResolvedValue({ id: 'inv-1' } as any);

            await service.generateMonthlyBilling('2023-01-01');

            expect(invoiceRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    amountExclVat: 50, // 100 * 0.5
                    vatAmount: 10, // 50 * 0.2
                    amountInclVat: 60,
                }),
            );
        });

        it('should NOT apply B1M20 promo code for subsequent months', async () => {
            const subs = [{ id: 's1', userId: 'u1', monthlyAmount: 100, status: 'ACTIVE', promoCode: 'B1M20' }];
            vi.mocked(subscriptionRepo.findAll).mockResolvedValue(subs as any);
            // Second invoice exists
            vi.mocked(invoiceRepo.countBySubscriptionId).mockResolvedValue(1);

            await service.generateMonthlyBilling('2023-01-01');

            expect(invoiceRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    amountExclVat: 100,
                }),
            );
        });
    });

    describe('updatePaymentStatuses', () => {
        it('should update invoice status to PAID and user status to OK if executed', async () => {
            vi.mocked(invoiceRepo.updateStatus).mockResolvedValue({ id: 'i1', userId: 'u1', status: 'PAID' } as any);

            await service.updatePaymentStatuses([{ invoiceId: 'i1', status: 'EXECUTED' }]);

            expect(invoiceRepo.updateStatus).toHaveBeenCalledWith('i1', 'PAID');
            expect(userRepo.updateStatus).toHaveBeenCalledWith('u1', 'OK');
        });

        it('should update invoice to FAILED and suspend user if rejected', async () => {
            vi.mocked(invoiceRepo.updateStatus).mockResolvedValue({ id: 'i1', userId: 'u1', status: 'FAILED' } as any);

            await service.updatePaymentStatuses([{ invoiceId: 'i1', status: 'REJECTED' }]);

            expect(invoiceRepo.updateStatus).toHaveBeenCalledWith('i1', 'FAILED');
            expect(userRepo.updateStatus).toHaveBeenCalledWith('u1', 'SUSPENDED');
        });
    });
});
