import type {
  ExportDirectDebits,
  GetMonthlyRevenue,
} from '../server/generated';

/**
 * Export direct debits for banking
 */
export const exportDirectDebits: ExportDirectDebits = async (params, respond) => {
  // TODO: Implement export logic
  throw new Error('Not implemented');
};

/**
 * Get monthly revenue report
 */
export const getMonthlyRevenue: GetMonthlyRevenue = async (params, respond) => {
  // TODO: Implement revenue calculation
  throw new Error('Not implemented');
};
