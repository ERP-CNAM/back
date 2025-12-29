import type {
  GenerateMonthlyBilling,
  ExportMonthlyInvoices,
} from '../server/generated';

/**
 * Generate monthly billing for all active subscriptions
 */
export const generateMonthlyBilling: GenerateMonthlyBilling = async (req, resp) => {
  // TODO: Implement billing logic
  throw new Error('Not implemented');
};

/**
 * Export monthly invoices for accounting
 */
export const exportMonthlyInvoices: ExportMonthlyInvoices = async (req, resp) => {
  // TODO: Implement export logic
  throw new Error('Not implemented');
};
