import type { InvoiceRepository } from '../repository/invoice.repository';
import type { UserRepository } from '../repository/user.repository';
import type { t_DirectDebitOrder } from '../../api/models';
import { generateUUID } from '../utils/uuid';
import { DEFAULT_FALLBACK_YEAR } from '../config/constants';

export class ReportService {
    constructor(
        private readonly invoiceRepository: InvoiceRepository,
        private readonly userRepository: UserRepository,
    ) {}

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
        const results = await Promise.all(
            pendingInvoices.map(async (invoice) => {
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
            }),
        );

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
        const endYear = parseInt(yearStr || DEFAULT_FALLBACK_YEAR.toString(), 10);
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
}
