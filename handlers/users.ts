import type { ListUsers, CreateUser, GetUser, UpdateUser, DeleteUser, UpdateUserStatus } from '../server/generated';
import type { t_User } from '../server/models';
import usersData from '../mock/users.json';

// In-memory data store
let users: t_User[] = usersData as t_User[];

/**
 * List users with optional status filter
 */
export const listUsers: ListUsers = async (req, resp) => {
  const { status } = req.query || {};

  const filteredUsers = status
    ? users.filter(u => u.status === status)
    : users;

  return resp.with200().body(filteredUsers);
};

/**
 * Create a new user
 */
export const createUser: CreateUser = async (req, resp) => {
  const userData = req.body;

  const newUser: t_User = {
    id: generateUUID(),
    ...userData,
    status: 'OK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);

  return resp.with201().body(newUser);
};

/**
 * Get a single user by ID
 */
export const getUser: GetUser = async (req, resp) => {
  const { userId } = req.params;

  const user = users.find(u => u.id === userId);

  if (!user) {
    return resp.with404();
  }

  return resp.with200().body(user);
};

/**
 * Update a user
 */
export const updateUser: UpdateUser = async (req, resp) => {
  const { userId } = req.params;
  const updates = req.body;

  const index = users.findIndex(u => u.id === userId);

  if (index === -1) {
    return resp.with404();
  }

  users[index] = {
    ...users[index],
    ...updates,
    id: userId, // Keep original ID
    updatedAt: new Date().toISOString(),
  };

  return resp.with200().body(users[index]);
};

/**
 * Delete (soft delete) a user
 */
export const deleteUser: DeleteUser = async (req, resp) => {
  const { userId } = req.params;

  const index = users.findIndex(u => u.id === userId);

  if (index === -1) {
    return resp.with404();
  }

  // Soft delete - mark as BLOQUE
  users[index].status = 'BLOQUE';
  users[index].updatedAt = new Date().toISOString();

  return resp.with204();
};

/**
 * Update user status
 */
export const updateUserStatus: UpdateUserStatus = async (req, resp) => {
  const { userId } = req.params;
  const { status } = req.body || {};

  const index = users.findIndex(u => u.id === userId);

  if (index === -1) {
    return resp.with404();
  }

  if (status) {
    users[index].status = status;
    users[index].updatedAt = new Date().toISOString();
  }

  return resp.with200().body(users[index]);
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
