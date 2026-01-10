/**
 * This file combines all handler modules with dependency injection for repositories
 */

import type { Implementation } from '../../api/generated';
import { DB_TYPE } from '../database/config';
import { InMemoryUserRepository } from '../repository/memory/in-memory-user.repository';
import { PostgresUserRepository } from '../repository/postgres/postgres-user.repository';
import { InMemoryAdminRepository } from '../repository/memory/in-memory-admin.repository';
import { PostgresAdminRepository } from '../repository/postgres/postgres-admin.repository';
import type { UserRepository } from '../repository/user.repository';
import type { AdminRepository } from '../repository/admin.repository';
import { getDatabase } from '../database/client';
import { createUserHandlers } from './user';
import { createAuthHandlers } from './auth';
import { createAdminAuthHandlers } from './admin-auth';
import * as subscriptions from './subscription';
import * as billing from './billing';
import * as reports from './report';

const databaseInstance = getDatabase();
let userRepository: UserRepository;
let adminRepository: AdminRepository;

if (DB_TYPE === 'postgres') {
    userRepository = new PostgresUserRepository(databaseInstance);
    adminRepository = new PostgresAdminRepository(databaseInstance);
} else {
    userRepository = new InMemoryUserRepository(databaseInstance);
    adminRepository = new InMemoryAdminRepository(databaseInstance);
}
const userHandlers = createUserHandlers(userRepository);
const authHandlers = createAuthHandlers(userRepository);
const adminAuthHandlers = createAdminAuthHandlers(adminRepository);

export const handlers: Implementation = {
    // Auth
    login: authHandlers.login,
    adminLogin: adminAuthHandlers.adminLogin,

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
