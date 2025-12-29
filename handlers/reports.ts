import type {
  ExportDirectDebits,
  GetMonthlyRevenue,
} from '../server/generated';

/**
 * Export direct debits for banking
 */
export const exportDirectDebits: ExportDirectDebits = async (req, resp) => {
  // TODO: Implement export logic
  throw new Error('Not implemented');
};

/**
 * Get monthly revenue report
 */
export const getMonthlyRevenue: GetMonthlyRevenue = async (req, resp) => {
  // TODO: Implement revenue calculation
  throw new Error('Not implemented');
};
