import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { t_UserStatus, t_SubscriptionStatus } from '../../../api/models';

export const users = sqliteTable('users', {
    id: text('id').primaryKey().notNull(),
    firstName: text('firstName'),
    lastName: text('lastName'),
    email: text('email').unique(),
    password: text('password').notNull(),

    // Address fields (required for SEPA mandates and FacturX)
    phone: text('phone'),
    address: text('address'),
    city: text('city'),
    postalCode: text('postalCode'),
    country: text('country').default('FR'), // ISO 3166-1 alpha-2
    dateOfBirth: text('dateOfBirth'), // Optional

    paymentMethod: text('paymentMethod'),
    status: text('status').$type<t_UserStatus>().notNull().default('BLOCKED'),
    createdAt: text('createdAt'),
    updatedAt: text('updatedAt'),
});

export const admins = sqliteTable('admins', {
    id: text('id').primaryKey().notNull(),
    firstName: text('firstName').notNull(),
    lastName: text('lastName').notNull(),
    email: text('email').unique().notNull(),
    password: text('password').notNull(),
    isActive: text('isActive').notNull().default('true'),
    lastLogin: text('lastLogin'),
    createdAt: text('createdAt'),
    updatedAt: text('updatedAt'),
});

export const subscriptions = sqliteTable('subscriptions', {
    id: text('id').primaryKey().notNull(),
    userId: text('userId').notNull(),
    contractCode: text('contractCode').notNull(),
    startDate: text('startDate').notNull(),
    endDate: text('endDate'),
    monthlyAmount: real('monthlyAmount').notNull(),
    promoCode: text('promoCode'),
    status: text('status').$type<t_SubscriptionStatus>().notNull().default('ACTIVE'),
});

export const invoices = sqliteTable('invoices', {
    id: text('id').primaryKey().notNull(),
    invoiceRef: text('invoiceRef').notNull().unique(),
    subscriptionId: text('subscriptionId').notNull(),
    userId: text('userId').notNull(),
    billingDate: text('billingDate').notNull(),
    periodStart: text('periodStart').notNull(),
    periodEnd: text('periodEnd').notNull(),
    amountExclVat: real('amountExclVat').notNull(),
    vatAmount: real('vatAmount').notNull(),
    amountInclVat: real('amountInclVat').notNull(),
    status: text('status').notNull().default('PENDING'),
});
