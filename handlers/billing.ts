import type {
  GenerateMonthlyBilling,
  ExportMonthlyInvoices,
} from '../server/generated';

/**
 * Generate monthly billing for all active subscriptions
 */
export const generateMonthlyBilling: GenerateMonthlyBilling = async (params, respond) => {
  // TODO: Implement billing logic
  throw new Error('Not implemented');
};

/**
 * Export monthly invoices for accounting
 */
export const exportMonthlyInvoices: ExportMonthlyInvoices = async (params, respond) => {
  // TODO: Implement export logic
  throw new Error('Not implemented');
};
