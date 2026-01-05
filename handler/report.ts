import type {
  ExportDirectDebits,
  GetMonthlyRevenue,
} from '../api/generated';

/**
 * Export direct debits for banking
 */
export const exportDirectDebits: ExportDirectDebits = async (params, respond) => {
  // TODO: Implement export logic
  const notImplemented = { params, respond };
  throw new Error(`Not implemented : ${notImplemented}`);
};

/**
 * Get monthly revenue report
 */
export const getMonthlyRevenue: GetMonthlyRevenue = async (params, respond) => {
  // TODO: Implement revenue calculation
  const notImplemented = { params, respond };
  throw new Error(`Not implemented : ${notImplemented}`);
};
