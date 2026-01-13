import type { Implementation } from '../../api/generated';
import { DB_TYPE } from '../database/config';
import { InMemoryUserRepository } from '../repository/memory/in-memory-user.repository';
import { PostgresUserRepository } from '../repository/postgres/postgres-user.repository';
import { InMemoryAdminRepository } from '../repository/memory/in-memory-admin.repository';
import { PostgresAdminRepository } from '../repository/postgres/postgres-admin.repository';
import { InMemorySubscriptionRepository } from '../repository/memory/in-memory-subscription.repository';
import { PostgresSubscriptionRepository } from '../repository/postgres/postgres-subscription.repository';
import type { UserRepository } from '../repository/user.repository';
import type { AdminRepository } from '../repository/admin.repository';
import type { SubscriptionRepository } from '../repository/subscription.repository';
import { getDatabase } from '../database/client';
import { createAuthHandlers } from './public/auth';
import { createRegistrationHandlers } from './public/registration';
import { createSubscriptionHandlers } from './authenticated/subscription';
import { createUserHandlers } from './admin/user';
import { createAdminAuthHandlers } from './admin/auth';
import * as billing from './admin/billing';
import * as reports from './admin/report';

const databaseInstance = getDatabase();
let userRepository: UserRepository;
let adminRepository: AdminRepository;
let subscriptionRepository: SubscriptionRepository;

if (DB_TYPE === 'postgres') {
    userRepository = new PostgresUserRepository(databaseInstance);
    adminRepository = new PostgresAdminRepository(databaseInstance);
    subscriptionRepository = new PostgresSubscriptionRepository(databaseInstance);
} else {
    userRepository = new InMemoryUserRepository(databaseInstance);
    adminRepository = new InMemoryAdminRepository(databaseInstance);
    subscriptionRepository = new InMemorySubscriptionRepository(databaseInstance);
}

const authHandlers = createAuthHandlers(userRepository);
const registrationHandlers = createRegistrationHandlers(userRepository);
const userHandlers = createUserHandlers(userRepository);
const adminAuthHandlers = createAdminAuthHandlers(adminRepository);
const subscriptionHandlers = createSubscriptionHandlers(subscriptionRepository);

export const handlers: Implementation = {
    // PUBLIC
    login: authHandlers.login,
    adminLogin: adminAuthHandlers.adminLogin,
    createUser: registrationHandlers.createUser,

    // AUTHENTICATED USER
    listSubscriptions: subscriptionHandlers.listSubscriptions,
    createSubscription: subscriptionHandlers.createSubscription,
    getSubscription: subscriptionHandlers.getSubscription,
    updateSubscription: subscriptionHandlers.updateSubscription,
    cancelSubscription: subscriptionHandlers.cancelSubscription,

    // ADMIN
    listUsers: userHandlers.listUsers,
    getUser: userHandlers.getUser,
    updateUser: userHandlers.updateUser,
    deleteUser: userHandlers.deleteUser,
    updateUserStatus: userHandlers.updateUserStatus,
    generateMonthlyBilling: billing.generateMonthlyBilling,
    exportMonthlyInvoices: billing.exportMonthlyInvoices,
    exportDirectDebits: reports.exportDirectDebits,
    getMonthlyRevenue: reports.getMonthlyRevenue,
};
