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
    /**
     * Creates an invoice
     *
     * @param data The invoice data
     * @returns The created invoice
     */
    create(data: CreateInvoiceDTO): Promise<t_Invoice>;

    /**
     * Finds all invoices
     *
     * @param filter The filter options (userId, subscriptionId, status)
     * @returns All invoices matching the filter
     */
    findAll(filter: {
        userId?: string;
        subscriptionId?: string;
        status?: 'PENDING' | 'SENT' | 'PAID' | 'FAILED';
    }): Promise<t_Invoice[]>;

    /**
     * Finds all invoices by date
     *
     * @param date The date
     * @returns The invoices for the given date
     */
    findAllByDate(date: string): Promise<t_Invoice[]>;

    /**
     * Finds all invoices by month
     *
     * @param month The month
     * @returns The invoices for the given month
     */
    findAllByMonth(month: string): Promise<t_Invoice[]>;

    /**
     * Finds all invoices by date range
     *
     * @param startDate The start date
     * @param endDate The end date
     * @returns The invoices for the given date range
     */
    findAllByDateRange(startDate: string, endDate: string): Promise<t_Invoice[]>;

    /**
     * Counts the number of invoices by subscription id
     *
     * @param subscriptionId The subscription id
     * @returns The count of invoices for the given subscription id
     */
    countBySubscriptionId(subscriptionId: string): Promise<number>;

    /**
     * Updates the status of an invoice
     *
     * @param id The id of the invoice
     * @param status The new status
     * @returns The updated invoice
     */
    updateStatus(id: string, status: 'PAID' | 'FAILED'): Promise<t_Invoice | null>;
}
