import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { t_UserStatus } from '../../api/models';

export const users = sqliteTable('users', {
    id: text('id').primaryKey().notNull(),
    firstName: text('firstName'),
    lastName: text('lastName'),
    email: text('email').unique(),
    password: text('password').notNull(),
    paymentMethod: text('paymentMethod'),
    status: text('status').$type<t_UserStatus>().notNull().default('OK'),
    createdAt: text('createdAt'),
    updatedAt: text('updatedAt'),
});
