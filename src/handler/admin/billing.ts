import type { GenerateMonthlyBilling, ExportMonthlyInvoices } from '../../../api/generated';
import type { BillingService } from '../../service/billing.service';
import type { ReportingService } from '../../service/reporting.service';

/**
 * Creates the billing handlers
 * 
 * @param billingService The billing service
 * @param reportingService The reporting service
 * 
 * @returns The billing handlers
 */
export function createBillingHandlers(
    billingService: BillingService,
    reportingService: ReportingService,
) {
    /**
     * Generates the monthly billing
     * 
     * @route POST /billing/monthly
     * 
     * @param params The request parameters
     * @param respond The response handler
     * 
     * @returns The response object
     */
    const generateMonthlyBilling: GenerateMonthlyBilling = async (params, respond) => {
        const { body } = params;
        const billingDate = body.billingDate; // Service defaults if undefined

        const result = await billingService.generateMonthlyBilling(billingDate);

        return respond.with200().body({
            success: true,
            message: `Generated ${result.invoices.length} invoices successfully`,
            payload: result,
        });
    };

    /**
     * Exports the monthly invoices
     * 
     * @route GET /exports/accounting/monthly-invoices
     * 
     * @param params The request parameters
     * @param respond The response handler
     * 
     * @returns The response object
     */
    const exportMonthlyInvoices: ExportMonthlyInvoices = async (params, respond) => {
        const { billingMonth } = params.query;

        const result = await reportingService.exportMonthlyInvoices(billingMonth);

        return respond.with200().body({
            success: true,
            message: `Export generated for ${billingMonth}`,
            payload: result,
        });
    };

    return {
        generateMonthlyBilling,
        exportMonthlyInvoices,
    };
}
