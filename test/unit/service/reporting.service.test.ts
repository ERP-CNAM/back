import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportingService } from '../../../src/service/reporting.service';
import type { InvoiceRepository } from '../../../src/repository/invoice.repository';
import type { UserRepository } from '../../../src/repository/user.repository';

describe('ReportingService', () => {
    let service: ReportingService;
    let invoiceRepo: InvoiceRepository;
    let userRepo: UserRepository;

    beforeEach(() => {
        invoiceRepo = {
            findAll: vi.fn(),
            updateStatus: vi.fn(),
            findAllByDate: vi.fn(),
            findAllByMonth: vi.fn(),
        } as unknown as InvoiceRepository;
        userRepo = {
            findById: vi.fn(),
            updateStatus: vi.fn(),
        } as unknown as UserRepository;

        service = new ReportingService(invoiceRepo, userRepo);
    });

    describe('exportDirectDebits', () => {
        it('should list SEPA invoices for direct debit', async () => {
            // 1. Mock Invoices
            const invoices = [
                { id: 'i1', userId: 'u1', amountInclVat: 100, status: 'PENDING' },
                { id: 'i2', userId: 'u2', amountInclVat: 200, status: 'PENDING' },
            ];
            vi.mocked(invoiceRepo.findAllByMonth).mockResolvedValue(invoices as any);

            // 2. Mock Users (u1=SEPA, u2=PAYPAL [Not allowed])
            vi.mocked(userRepo.findById).mockImplementation(async (id) => {
                if (id === 'u1') return { id: 'u1', paymentMethod: { type: 'SEPA' } } as any;
                if (id === 'u2') return { id: 'u2', paymentMethod: { type: 'PAYPAL' } } as any;
                return null;
            });

            const result = await service.exportDirectDebits('2023-01-01');

            expect(result).toHaveLength(1);
            expect(result[0].userId).toBe('u1');
            expect(result[0].status).toBe('TO_SEND');
        });
    });
});
