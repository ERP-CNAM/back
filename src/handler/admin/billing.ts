import type { GenerateMonthlyBilling, ExportMonthlyInvoices } from '../../../api/generated';
import type { InvoiceRepository } from '../../repository/invoice.repository';
import type { SubscriptionRepository } from '../../repository/subscription.repository';

export function createBillingHandlers(
    invoiceRepository: InvoiceRepository,
    subscriptionRepository: SubscriptionRepository
) {
    // POST /billing/monthly
    const generateMonthlyBilling: GenerateMonthlyBilling = async (params, respond) => {
        const { body } = params;
        const billingDate = body.billingDate || new Date().toISOString().slice(0, 10);
        const dateObj = new Date(billingDate);

        // 1. Fetch active subscriptions
        const activeSubscriptions = await subscriptionRepository.findAll({ status: 'ACTIVE' });
        
        const invoices = [];

        // 2. Generate invoices for each subscription
        for (const sub of activeSubscriptions) {
            const amountExclVat = sub.monthlyAmount || 0;
            const vatRate = 0.20;
            const vatAmount = Number((amountExclVat * vatRate).toFixed(2));
            const amountInclVat = Number((amountExclVat + vatAmount).toFixed(2));

            // Define period (full month as per spec assumption)
            const periodStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toISOString().slice(0, 10);
            const periodEnd = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).toISOString().slice(0, 10);

            const invoice = await invoiceRepository.create({
                invoiceRef: `INV-${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${sub.contractCode}`,
                subscriptionId: sub.id!,
                userId: sub.userId!,
                billingDate: billingDate,
                periodStart,
                periodEnd,
                amountExclVat,
                vatAmount,
                amountInclVat,
                status: 'PENDING',
            });

            invoices.push(invoice);
        }

        return respond.with200().body({
            success: true,
            message: `Generated ${invoices.length} invoices successfully`,
            payload: {
                billingDate,
                invoices,
            },
        });
    };

    // GET /exports/accounting/monthly-invoices
    const exportMonthlyInvoices: ExportMonthlyInvoices = async (params, respond) => {
        // TODO: Implement export logic
        const notImplemented = { params, respond };
        throw new Error(`Not implemented : ${notImplemented}`);
    };

    return {
        generateMonthlyBilling,
        exportMonthlyInvoices,
    };
}

