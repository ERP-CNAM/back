import type { GenerateMonthlyBilling } from '../../../api/generated';
import type { BillingService } from '../../service/billing.service';
import type { UpdatePaymentStatus } from '../../../api/generated';

/**
 * Creates the billing handlers
 *
 * @param billingService The billing service
 *
 * @returns The billing handlers
 */
export function createBillingHandlers(billingService: BillingService) {
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
        generateMonthlyBilling,
        updatePaymentStatus,
    };
}
