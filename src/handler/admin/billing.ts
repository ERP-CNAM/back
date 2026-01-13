import type { GenerateMonthlyBilling, ExportMonthlyInvoices } from '../../../api/generated';

// POST /billing/monthly
export const generateMonthlyBilling: GenerateMonthlyBilling = async (params, respond) => {
    // TODO: Implement billing logic
    const notImplemented = { params, respond };
    throw new Error(`Not implemented : ${notImplemented}`);
};

// GET /exports/accounting/monthly-invoices
export const exportMonthlyInvoices: ExportMonthlyInvoices = async (params, respond) => {
    // TODO: Implement export logic
    const notImplemented = { params, respond };
    throw new Error(`Not implemented : ${notImplemented}`);
};
