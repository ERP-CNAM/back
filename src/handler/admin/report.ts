import type { ExportDirectDebits, GetMonthlyRevenue, UpdatePaymentStatus } from '../../../api/generated';
import type { BillingService } from '../../service/billing.service';
import type { ReportService } from '../../service/report.service';

/**
 * Creates the report handlers
 *
 * @param billingService The billing service
 * @param reportService The reporting service
 *
 * @returns The report handlers
 */
export function createReportHandlers(
    billingService: BillingService,
    reportService: ReportService,
) {
    /**
     * Exports the direct debits
     *
     * @route GET /exports/banking/direct-debits
     *
     * @param params The request parameters
     * @param respond The response handler
     *
     * @returns The response object
     */
    const exportDirectDebits: ExportDirectDebits = async (params, respond) => {
        const { executionDate } = params.query; // YYYY-MM-DD

        const directDebits = await reportService.exportDirectDebits(executionDate);

        return respond.with200().body({
            success: true,
            message: `Generated ${directDebits.length} direct debit orders for execution on ${executionDate}`,
            payload: directDebits,
        });
    };

    /**
     * Gets the monthly revenue
     *
     * @route GET /reports/revenue/monthly
     *
     * @param params The request parameters
     * @param respond The response handler
     *
     * @returns The response object
     */
    const getMonthlyRevenue: GetMonthlyRevenue = async (params, respond) => {
        const { from, to } = params.query;

        const payload = await reportService.getMonthlyRevenue(from, to);

        return respond.with200().body({
            success: true,
            message: `Revenue report generated from ${from || 'start'} to ${to || 'end'}`,
            payload,
        });
    };

    /**
     * Updates the payment status
     *
     * @route POST /bank/payment-updates
     *
     * @param params The request parameters
     * @param respond The response handler
     *
     * @returns The response object
     */
    const updatePaymentStatus: UpdatePaymentStatus = async (params, respond) => {
        const updates = params.body;

        const updatedCount = await billingService.updatePaymentStatuses(updates);

        return respond.with200().body({
            success: true,
            message: 'Payment statuses updated',
            payload: { updatedCount },
        });
    };

    return {
        exportDirectDebits,
        getMonthlyRevenue,
        updatePaymentStatus,
    };
}
