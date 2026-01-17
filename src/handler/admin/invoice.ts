import type { ListInvoices } from '../../../api/generated';
import type { InvoiceService } from '../../service/invoice.service';

/**
 * Creates the invoice handlers
 * 
 * @param invoiceRepo The invoice repository
 * @param subscriptionRepo The subscription repository
 * @param userRepo The user repository
 * 
 * @returns The invoice handlers
 */
export function createInvoiceHandlers(invoiceService: InvoiceService) {
    /**
     * Lists the invoices
     * 
     * @route GET /invoices?userId=&subscriptionId=&status=
     * 
     * @param params The request parameters
     * @param respond The response handler
     * 
     * @returns The response object
     */
    const listInvoices: ListInvoices = async (params, respond) => {
        const { userId, subscriptionId, status } = params.query || {};

        const invoices = await invoiceService.listInvoices({ userId, subscriptionId, status });

        return respond.with200().body({
            success: true,
            message: 'Invoices retrieved successfully',
            payload: invoices,
        });
    };

    return { listInvoices };
}
