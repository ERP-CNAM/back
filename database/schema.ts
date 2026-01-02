import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  firstName: text('firstName'),
  lastName: text('lastName'),
  email: text('email').unique(),
  paymentMethod: text('paymentMethod'),
  status: text('status'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});
