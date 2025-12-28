import type { Implementation, ListUsers, CreateUser, GetUser, UpdateUser, DeleteUser, UpdateUserStatus } from './generated';
import type { t_User } from './models';
import usersData from '../mock/users.json';

// In-memory data store (replace with database later)
let users: t_User[] = usersData as t_User[];

/**
 * List users with optional status filter
 */
export const listUsers: ListUsers = async (params, respond) => {
  const { status } = params.query || {};

  const filteredUsers = status
    ? users.filter(u => u.status === status)
    : users;

  return respond.with200().body(filteredUsers);
};

/**
 * Create a new user
 */
export const createUser: CreateUser = async (params, respond) => {
  const userData = params.body;

  const newUser: t_User = {
    id: generateUUID(),
    ...userData,
    status: 'OK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);

  return respond.with201().body(newUser);
};

/**
 * Get a single user by ID
 */
export const getUser: GetUser = async (params, respond) => {
  const { userId } = params.params;

  const user = users.find(u => u.id === userId);

  if (!user) {
    return respond.with404();
  }

  return respond.with200().body(user);
};

/**
 * Update a user
 */
export const updateUser: UpdateUser = async (params, respond) => {
  const { userId } = params.params;
  const updates = params.body;

  const index = users.findIndex(u => u.id === userId);

  if (index === -1) {
    return respond.with404();
  }

  users[index] = {
    ...users[index],
    ...updates,
    id: userId, // Keep original ID
    updatedAt: new Date().toISOString(),
  };

  return respond.with200().body(users[index]);
};

/**
 * Delete (soft delete) a user
 */
export const deleteUser: DeleteUser = async (params, respond) => {
  const { userId } = params.params;

  const index = users.findIndex(u => u.id === userId);

  if (index === -1) {
    return respond.with404();
  }

  // Soft delete - mark as BLOQUE
  users[index].status = 'BLOQUE';
  users[index].updatedAt = new Date().toISOString();

  return respond.with204();
};

/**
 * Update user status
 */
export const updateUserStatus: UpdateUserStatus = async (params, respond) => {
  const { userId } = params.params;
  const { status } = params.body || {};

  const index = users.findIndex(u => u.id === userId);

  if (index === -1) {
    return respond.with404();
  }

  if (status) {
    users[index].status = status;
    users[index].updatedAt = new Date().toISOString();
  }

  return respond.with200().body(users[index]);
};

// TODO: Implement subscription handlers
export const listSubscriptions: Implementation['listSubscriptions'] = async (params, respond) => {
  // TODO: Implement
  return respond.with200().body([]);
};

export const createSubscription: Implementation['createSubscription'] = async (params, respond) => {
  // TODO: Implement
  throw new Error('Not implemented');
};

export const getSubscription: Implementation['getSubscription'] = async (params, respond) => {
  // TODO: Implement
  return respond.with404();
};

export const updateSubscription: Implementation['updateSubscription'] = async (params, respond) => {
  // TODO: Implement
  return respond.with404();
};

export const cancelSubscription: Implementation['cancelSubscription'] = async (params, respond) => {
  // TODO: Implement
  return respond.with404();
};

// TODO: Implement billing handlers
export const generateMonthlyBilling: Implementation['generateMonthlyBilling'] = async (params, respond) => {
  // TODO: Implement
  return respond.with200().body({
    billingDate: params.body?.billingDate,
    invoices: [],
  });
};

export const exportMonthlyInvoices: Implementation['exportMonthlyInvoices'] = async (params, respond) => {
  // TODO: Implement
  return respond.with200().body([]);
};

export const exportDirectDebits: Implementation['exportDirectDebits'] = async (params, respond) => {
  // TODO: Implement
  return respond.with200().body([]);
};

export const getMonthlyRevenue: Implementation['getMonthlyRevenue'] = async (params, respond) => {
  // TODO: Implement
  return respond.with200().body([]);
};

// Helper function to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
