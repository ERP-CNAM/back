import type { Implementation } from '../../api/generated';
import { DB_TYPE } from '../database/config';
import { InMemoryUserRepository } from '../repository/memory/in-memory-user.repository';
import { PostgresUserRepository } from '../repository/postgres/postgres-user.repository';
import { InMemoryAdminRepository } from '../repository/memory/in-memory-admin.repository';
import { PostgresAdminRepository } from '../repository/postgres/postgres-admin.repository';
import { InMemorySubscriptionRepository } from '../repository/memory/in-memory-subscription.repository';
import { PostgresSubscriptionRepository } from '../repository/postgres/postgres-subscription.repository';
import { InMemoryInvoiceRepository } from '../repository/memory/in-memory-invoice.repository';
import { PostgresInvoiceRepository } from '../repository/postgres/postgres-invoice.repository';
import type { UserRepository } from '../repository/user.repository';
import type { AdminRepository } from '../repository/admin.repository';
import type { SubscriptionRepository } from '../repository/subscription.repository';
import type { InvoiceRepository } from '../repository/invoice.repository';
import { getDatabase } from '../database/client';
import { createAuthHandlers } from './public/auth';
import { createRegistrationHandlers } from './public/registration';
import { createSubscriptionHandlers } from './authenticated/subscription';
import { createUserHandlers } from './admin/user';
import { createAdminAuthHandlers } from './admin/auth';
import { createBillingHandlers } from './admin/billing';
import { createReportHandlers } from './admin/report';

const databaseInstance = getDatabase();
let userRepository: UserRepository;
let adminRepository: AdminRepository;
let subscriptionRepository: SubscriptionRepository;
let invoiceRepository: InvoiceRepository;

if (DB_TYPE === 'postgres') {
    userRepository = new PostgresUserRepository(databaseInstance);
    adminRepository = new PostgresAdminRepository(databaseInstance);
    subscriptionRepository = new PostgresSubscriptionRepository(databaseInstance);
    invoiceRepository = new PostgresInvoiceRepository(databaseInstance);
} else {
    userRepository = new InMemoryUserRepository(databaseInstance);
    adminRepository = new InMemoryAdminRepository(databaseInstance);
    subscriptionRepository = new InMemorySubscriptionRepository(databaseInstance);
    invoiceRepository = new InMemoryInvoiceRepository(databaseInstance);
}

const authHandlers = createAuthHandlers(userRepository);
const registrationHandlers = createRegistrationHandlers(userRepository);
const userHandlers = createUserHandlers(userRepository);
const adminAuthHandlers = createAdminAuthHandlers(adminRepository);
const subscriptionHandlers = createSubscriptionHandlers(subscriptionRepository);
const billingHandlers = createBillingHandlers(invoiceRepository, subscriptionRepository, userRepository);
const reportHandlers = createReportHandlers(invoiceRepository, userRepository);

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
    generateMonthlyBilling: billingHandlers.generateMonthlyBilling,
    exportMonthlyInvoices: billingHandlers.exportMonthlyInvoices,
    exportDirectDebits: reportHandlers.exportDirectDebits,
    getMonthlyRevenue: reportHandlers.getMonthlyRevenue,
};