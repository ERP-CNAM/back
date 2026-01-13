import type { GenerateMonthlyBilling, ExportMonthlyInvoices } from '../../../api/generated';
import type { InvoiceRepository } from '../../repository/invoice.repository';
import type { SubscriptionRepository } from '../../repository/subscription.repository';
import type { UserRepository } from '../../repository/user.repository';
import type { t_AccountingExportLine } from '../../../api/models';

export function createBillingHandlers(
    invoiceRepository: InvoiceRepository,
    subscriptionRepository: SubscriptionRepository,
    userRepository: UserRepository,
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
            let amountExclVat = sub.monthlyAmount || 0;

            // Apply 50% discount on first payment if promo code is 'B1M20'
            if (sub.promoCode === 'B1M20') {
                const previousInvoicesCount = await invoiceRepository.countBySubscriptionId(sub.id!);
                if (previousInvoicesCount === 0) {
                    amountExclVat = amountExclVat * 0.5;
                }
            }

            const vatRate = 0.2;
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
        const { billingMonth } = params.query;

        // 1. Fetch invoices for the month
        const invoices = await invoiceRepository.findAllByMonth(billingMonth);

        const exportLines: t_AccountingExportLine[] = [];

        for (const invoice of invoices) {
            // 2. Fetch User for name
            const user = await userRepository.findById(invoice.userId!);
            const customerName = user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer';
            const clientAccount = `AUX_${user?.lastName?.toUpperCase().slice(0, 5) || 'CLI'}`;

            // 3. Generate Accounting Lines

            // Line 1: Debit Client (Total Incl VAT)
            exportLines.push({
                date: invoice.billingDate,
                generalAccount: '411',
                clientAccount,
                invoiceRef: invoice.invoiceRef,
                description: `Facturation abonnement mensuel - ${customerName}`,
                debit: invoice.amountInclVat,
                credit: null,
                customerName,
            });

            // Line 2: Credit Product (Excl VAT)
            exportLines.push({
                date: invoice.billingDate,
                generalAccount: '706',
                clientAccount: undefined,
                invoiceRef: invoice.invoiceRef,
                description: 'Prestation de service HT',
                debit: null,
                credit: invoice.amountExclVat,
                customerName,
            });

            // Line 3: Credit VAT (VAT Amount)
            exportLines.push({
                date: invoice.billingDate,
                generalAccount: '445',
                clientAccount: undefined,
                invoiceRef: invoice.invoiceRef,
                description: 'TVA collectée 20%',
                debit: null,
                credit: invoice.vatAmount,
                customerName,
            });
        }

        return respond.with200().body({
            success: true,
            message: `Export generated for ${billingMonth}`,
            payload: exportLines,
        });
    };

    return {
        generateMonthlyBilling,
        exportMonthlyInvoices,
    };
}
