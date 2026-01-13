import type { t_Invoice } from '../../api/models';

export type CreateInvoiceDTO = {
    invoiceRef: string;
    subscriptionId: string;
    userId: string;
    billingDate: string;
    periodStart: string;
    periodEnd: string;
    amountExclVat: number;
    vatAmount: number;
    amountInclVat: number;
    status: 'PENDING' | 'SENT' | 'PAID' | 'FAILED';
};

export interface InvoiceRepository {
    create(data: CreateInvoiceDTO): Promise<t_Invoice>;
    findAllByDate(date: string): Promise<t_Invoice[]>;
    findAllByMonth(month: string): Promise<t_Invoice[]>;
    findAllByDateRange(startDate: string, endDate: string): Promise<t_Invoice[]>;
}
