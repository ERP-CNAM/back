/**
 * This file combines all handler modules with dependency injection for repositories
 */

import type { Implementation } from '../api/generated';
import { DB_TYPE } from '../database/config';
import { InMemoryUserRepository } from '../repository/memory/in-memory-user.repository';
import { PostgresUserRepository } from '../repository/postgres/postgres-user.repository';
import type { UserRepository } from '../repository/user.repository';
import { getDatabase } from '../database/client';
import { createUserHandlers } from './user';
import * as subscriptions from './subscription';
import * as billing from './billing';
import * as reports from './report';

const db = getDatabase();
let userRepository: UserRepository;

if (DB_TYPE === 'postgres') {
    userRepository = new PostgresUserRepository(db);
} else {
    userRepository = new InMemoryUserRepository(db);
}
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
