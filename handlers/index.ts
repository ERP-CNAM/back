/**
 * This file combines all handler modules with dependency injection for repositories
 */

import type { Implementation } from '../server/generated';
import { InMemoryUserRepository } from '../repositories/implementations/memory/InMemoryUserRepository';
import { getDatabase } from '../database/memory/client';
import { createUserHandlers } from './users';
import * as subscriptions from './subscriptions';
import * as billing from './billing';
import * as reports from './reports';

const db = getDatabase();
const userRepository = new InMemoryUserRepository(db);
const userHandlers = createUserHandlers(userRepository);

export const handlers: Implementation = {
  // Users
  listUsers: userHandlers.listUsers,
  createUser: userHandlers.createUser,
  getUser: userHandlers.getUser,
  updateUser: userHandlers.updateUser,
  deleteUser: userHandlers.deleteUser,
  updateUserStatus: userHandlers.updateUserStatus,

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
