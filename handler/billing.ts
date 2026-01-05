import type { GenerateMonthlyBilling, ExportMonthlyInvoices } from '../api/generated';

/**
 * Generate monthly billing for all active subscriptions
 */
export const generateMonthlyBilling: GenerateMonthlyBilling = async (params, respond) => {
    // TODO: Implement billing logic
    const notImplemented = { params, respond };
    throw new Error(`Not implemented : ${notImplemented}`);
};

/**
 * Export monthly invoices for accounting
 */
export const exportMonthlyInvoices: ExportMonthlyInvoices = async (params, respond) => {
    // TODO: Implement export logic
    const notImplemented = { params, respond };
    throw new Error(`Not implemented : ${notImplemented}`);
};
