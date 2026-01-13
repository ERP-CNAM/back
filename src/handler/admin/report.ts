import type { ExportDirectDebits, GetMonthlyRevenue } from '../../../api/generated';

// GET /exports/banking/direct-debits
export const exportDirectDebits: ExportDirectDebits = async (params, respond) => {
    // TODO: Implement export logic
    const notImplemented = { params, respond };
    throw new Error(`Not implemented : ${notImplemented}`);
};

// GET /reports/revenue/monthly
export const getMonthlyRevenue: GetMonthlyRevenue = async (params, respond) => {
    // TODO: Implement revenue calculation
    const notImplemented = { params, respond };
    throw new Error(`Not implemented : ${notImplemented}`);
};
