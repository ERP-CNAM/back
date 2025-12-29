import type { ListUsers, CreateUser, GetUser, UpdateUser, DeleteUser, UpdateUserStatus } from '../server/generated';
import type { t_User } from '../server/models';
import usersData from '../mock/users.json';

// In-memory data store
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
    return respond.with404().body();
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
    return respond.with404().body();
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
    return respond.with404().body();
  }

  // Soft delete - mark as BLOQUE
  users[index].status = 'BLOQUE';
  users[index].updatedAt = new Date().toISOString();

  return respond.with204().body();
};

/**
 * Update user status
 */
export const updateUserStatus: UpdateUserStatus = async (params, respond) => {
  const { userId } = params.params;
  const { status } = params.body;

  const index = users.findIndex(u => u.id === userId);

  if (index === -1) {
    return respond.with404().body();
  }

  if (status) {
    users[index].status = status;
    users[index].updatedAt = new Date().toISOString();
  }

  return respond.with200().body(users[index]);
};

/**
 * Helper function to generate UUID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
