/**
 * Central export point for all handlers
 * This file combines all handler modules into a single Implementation object
 */

import type { Implementation } from '../server/generated';
import * as users from './users';
import * as subscriptions from './subscriptions';
import * as billing from './billing';
import * as reports from './reports';

/**
 * Complete implementation of all API handlers
 * This object matches the Implementation interface from generated code
 */
export const handlers: Implementation = {
  // Users
  listUsers: users.listUsers,
  createUser: users.createUser,
  getUser: users.getUser,
  updateUser: users.updateUser,
  deleteUser: users.deleteUser,
  updateUserStatus: users.updateUserStatus,

  // Subscriptions
  listSubscriptions: subscriptions.listSubscriptions,
  createSubscription: subscriptions.createSubscription,
  getSubscription: subscriptions.getSubscription,
  updateSubscription: subscriptions.updateSubscription,
  cancelSubscription: subscriptions.cancelSubscription,

  // Billing
  generateMonthlyBilling: billing.generateMonthlyBilling,
  exportMonthlyInvoices: billing.exportMonthlyInvoices,

  // Reports
  exportDirectDebits: reports.exportDirectDebits,
  getMonthlyRevenue: reports.getMonthlyRevenue,
};
