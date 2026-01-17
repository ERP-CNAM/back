import type { InvoiceRepository } from '../repository/invoice.repository';
import type { UserRepository } from '../repository/user.repository';
import type { t_AccountingExportLine, t_DirectDebitOrder } from '../../api/models';
import { generateUUID } from '../utils/uuid';

export class ReportService {
    constructor(
        private readonly invoiceRepository: InvoiceRepository,
        private readonly userRepository: UserRepository,
    ) { }

    /**
     * Exports direct debit orders for a given execution date.
     * @param executionDate The execution date (YYYY-MM-DD).
     */
    async exportDirectDebits(executionDate: string): Promise<t_DirectDebitOrder[]> {
        // Calculate the billing month (previous month relative to executionDate)
        const dateObj = new Date(executionDate);
        dateObj.setMonth(dateObj.getMonth() - 1);
        const billingMonth = dateObj.toISOString().slice(0, 7); // YYYY-MM

        // 1. Fetch invoices for the billing month
        const invoices = await this.invoiceRepository.findAllByMonth(billingMonth);

        // 2. Filter pending invoices
        const pendingInvoices = invoices.filter((inv) => inv.status === 'PENDING' || inv.status === 'SENT');

        // 3. Process each invoice to check user payment method
        const results = await Promise.all(pendingInvoices.map(async (invoice) => {
            const user = await this.userRepository.findById(invoice.userId!);

            if (
                user &&
                user.paymentMethod &&
                (user.paymentMethod.type === 'SEPA' || user.paymentMethod.type === 'CARD')
            ) {
                return {
                    id: generateUUID(),
                    invoiceId: invoice.id,
                    userId: user.id,
                    executionDate: executionDate,
                    amount: invoice.amountInclVat,
                    status: 'TO_SEND',
                    paymentMethod: user.paymentMethod.type,
                } as t_DirectDebitOrder;
            }
            return null;
        }));

        // Filter out nulls
        return results.filter((item): item is t_DirectDebitOrder => item !== null);
    }

    /**
     * Gets monthly revenue statistics.
     * @param from Start month (YYYY-MM).
     * @param to End month (YYYY-MM).
     */
    async getMonthlyRevenue(from?: string, to?: string) {
        // Default range logic should be moved here or kept in handler?
        // Let's keep input flexible but handle defaults if useful.
        const now = new Date();
        const startMonth = from || `${now.getFullYear()}-01`;
        const endMonth = to || `${now.getFullYear()}-12`;

        const startDate = `${startMonth}-01`;

        // Calculate last day of end month
        const [yearStr, monthStr] = endMonth.split('-');
        const endYear = parseInt(yearStr || '2026', 10);
        const endMonthNum = parseInt(monthStr || '12', 10);
        const lastDay = new Date(endYear, endMonthNum, 0).getDate();
        const endDate = `${endMonth}-${lastDay}`;

        const invoices = await this.invoiceRepository.findAllByDateRange(startDate, endDate);

        // Aggregation
        const revenueMap = new Map<string, { revenueExclVat: number; vatAmount: number; revenueInclVat: number }>();

        for (const invoice of invoices) {
            const month = invoice.billingDate!.slice(0, 7); // YYYY-MM

            const current = revenueMap.get(month) || { revenueExclVat: 0, vatAmount: 0, revenueInclVat: 0 };

            current.revenueExclVat += invoice.amountExclVat || 0;
            current.vatAmount += invoice.vatAmount || 0;
            current.revenueInclVat += invoice.amountInclVat || 0;

            revenueMap.set(month, current);
        }

        // Format result
        return Array.from(revenueMap.entries())
            .map(([month, data]) => ({
                month,
                revenueExclVat: Number(data.revenueExclVat.toFixed(2)),
                vatAmount: Number(data.vatAmount.toFixed(2)),
                revenueInclVat: Number(data.revenueInclVat.toFixed(2)),
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }

    /**
     * Exports monthly invoices for accounting.
     * @param billingMonth The billing month (YYYY-MM).
     */
    async exportMonthlyInvoices(billingMonth: string): Promise<t_AccountingExportLine[]> {
        // 1. Fetch invoices for the month
        const invoices = await this.invoiceRepository.findAllByMonth(billingMonth);

        const exportLines: t_AccountingExportLine[] = [];

        // 2. Process invoices
        // We can parallelize user fetching here
        const processedInvoices = await Promise.all(invoices.map(async (invoice) => {
            const user = await this.userRepository.findById(invoice.userId!);
            const customerName = user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer';
            // Logic for clientAccount: AUX_ + first 5 chars of lastName or CLI
            const clientAccount = `AUX_${user?.lastName?.toUpperCase().slice(0, 5) || 'CLI'}`;

            return { invoice, customerName, clientAccount };
        }));

        for (const { invoice, customerName, clientAccount } of processedInvoices) {
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
                generalAccount: '700',
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

        return exportLines;
    }
}
