import { pgTable, text, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';
import { t_UserStatus } from '../../../api/models';

export const users = pgTable('users', {
    id: uuid('id').primaryKey().notNull(),
    firstName: varchar('firstName', { length: 255 }),
    lastName: varchar('lastName', { length: 255 }),
    email: varchar('email', { length: 255 }).unique(),
    password: varchar('password', { length: 255 }).notNull(), // Hashed password
    paymentMethod: text('paymentMethod'), // Storing JSON string
    status: varchar('status', { length: 50 }).$type<t_UserStatus>().notNull().default('OK'),
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
