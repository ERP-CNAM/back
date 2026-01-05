import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { t_UserStatus } from '../../api/models';
import { generateUUID } from '../../utils/uuid';

export const users = sqliteTable('users', {
    id: text('id').primaryKey().notNull().default(generateUUID()),
    firstName: text('firstName'),
    lastName: text('lastName'),
    email: text('email').unique(),
    paymentMethod: text('paymentMethod'),
    status: text('status').$type<t_UserStatus>().notNull().default('OK'),
    createdAt: text('createdAt'),
    updatedAt: text('updatedAt'),
});
