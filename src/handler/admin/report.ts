import type { ExportDirectDebits, GetMonthlyRevenue } from '../../../api/generated';
import type { InvoiceRepository } from '../../repository/invoice.repository';
import type { UserRepository } from '../../repository/user.repository';
import type { t_DirectDebitOrder } from '../../../api/models';
import { generateUUID } from '../../utils/uuid';

export function createReportHandlers(
    invoiceRepository: InvoiceRepository,
    userRepository: UserRepository
) {
    // GET /exports/banking/direct-debits
    const exportDirectDebits: ExportDirectDebits = async (params, respond) => {
        const { executionDate } = params.query; // YYYY-MM-DD
        
        // Calculate the billing month (previous month relative to executionDate)
        const dateObj = new Date(executionDate);
        dateObj.setMonth(dateObj.getMonth() - 1);
        const billingMonth = dateObj.toISOString().slice(0, 7); // YYYY-MM

        // 1. Fetch invoices for the billing month
        const invoices = await invoiceRepository.findAllByMonth(billingMonth);
        
        // 2. Filter pending invoices
        const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING' || inv.status === 'SENT');

        const directDebits: t_DirectDebitOrder[] = [];

        for (const invoice of pendingInvoices) {
            // 3. Fetch user to check payment method
            const user = await userRepository.findById(invoice.userId!);
            
            if (user && user.paymentMethod && (user.paymentMethod.type === 'SEPA' || user.paymentMethod.type === 'CARD')) {
                directDebits.push({
                    id: generateUUID(),
                    invoiceId: invoice.id,
                    userId: user.id,
                    executionDate: executionDate,
                    amount: invoice.amountInclVat,
                    status: 'TO_SEND',
                    paymentMethod: user.paymentMethod.type
                });
            }
        }

        return respond.with200().body({
            success: true,
            message: `Generated ${directDebits.length} direct debit orders for execution on ${executionDate}`,
            payload: directDebits
        });
    };

    // GET /reports/revenue/monthly
    const getMonthlyRevenue: GetMonthlyRevenue = async (params, respond) => {
        const { from, to } = params.query;

        // Default range: current year if not specified, or reasonable defaults
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

        const invoices = await invoiceRepository.findAllByDateRange(startDate, endDate);

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
        const payload = Array.from(revenueMap.entries())
            .map(([month, data]) => ({
                month,
                revenueExclVat: Number(data.revenueExclVat.toFixed(2)),
                vatAmount: Number(data.vatAmount.toFixed(2)),
                revenueInclVat: Number(data.revenueInclVat.toFixed(2)),
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        return respond.with200().body({
            success: true,
            message: `Revenue report generated from ${startMonth} to ${endMonth}`,
            payload
        });
    };

    return {
        exportDirectDebits,
        getMonthlyRevenue
    };
}

