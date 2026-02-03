import { pgTable, text, varchar, timestamp, uuid, numeric } from 'drizzle-orm/pg-core';
import { t_UserStatus } from '../../../api/models';
import { t_SubscriptionStatus } from '../../../api/models';

export const users = pgTable('users', {
    id: uuid('id').primaryKey().notNull(),
    firstName: varchar('firstName', { length: 255 }),
    lastName: varchar('lastName', { length: 255 }),
    email: varchar('email', { length: 255 }).unique(),
    password: varchar('password', { length: 255 }).notNull(), // Hashed password

    // Address fields (required for SEPA mandates and FacturX)
    phone: varchar('phone', { length: 20 }),
    address: varchar('address', { length: 255 }),
    city: varchar('city', { length: 100 }),
    postalCode: varchar('postalCode', { length: 10 }),
    country: varchar('country', { length: 2 }).default('FR'), // ISO 3166-1 alpha-2
    dateOfBirth: timestamp('dateOfBirth'), // Optional

    paymentMethod: text('paymentMethod'), // Storing JSON string
    status: varchar('status', { length: 50 }).$type<t_UserStatus>().notNull().default('BLOCKED'),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow(),
});

export const admins = pgTable('admins', {
    id: uuid('id').primaryKey().notNull(),
    firstName: varchar('firstName', { length: 255 }).notNull(),
    lastName: varchar('lastName', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    password: varchar('password', { length: 255 }).notNull(), // Hashed password
    isActive: varchar('isActive', { length: 10 }).notNull().default('true'),
    lastLogin: timestamp('lastLogin'),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
    id: uuid('id').primaryKey().notNull(),
    userId: uuid('userId').notNull(),
    contractCode: varchar('contractCode', { length: 50 }).notNull(),
    startDate: timestamp('startDate').notNull(),
    endDate: timestamp('endDate'),
    monthlyAmount: numeric('monthlyAmount', { precision: 10, scale: 2 }).notNull(),
    promoCode: varchar('promoCode', { length: 50 }),
    status: varchar('status', { length: 50 }).$type<t_SubscriptionStatus>().notNull().default('ACTIVE'),
});

export const invoices = pgTable('invoices', {
    id: uuid('id').primaryKey().notNull(),
    invoiceRef: varchar('invoiceRef', { length: 50 }).notNull().unique(),
    subscriptionId: uuid('subscriptionId').notNull(),
    userId: uuid('userId').notNull(),
    billingDate: timestamp('billingDate').notNull(),
    periodStart: timestamp('periodStart').notNull(),
    periodEnd: timestamp('periodEnd').notNull(),
    amountExclVat: numeric('amountExclVat', { precision: 10, scale: 2 }).notNull(),
    vatAmount: numeric('vatAmount', { precision: 10, scale: 2 }).notNull(),
    amountInclVat: numeric('amountInclVat', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('PENDING'),
});
