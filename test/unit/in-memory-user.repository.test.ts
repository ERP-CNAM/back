import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryUserRepository } from '../../repository/memory/in-memory-user.repository';
import type {
  t_CreateUserRequestBodySchema,
  t_UpdateUserRequestBodySchema,
  t_User,
  t_UserStatus
} from '../../api/models';
import { createTestDatabase } from '../../database/memory/client';

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;
  const data: t_User[] = [
    {
      id: 'user-1',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      status: 'OK',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'user-2',
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      status: 'SUSPENDED',
      createdAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    },
    {
      id: 'user-3',
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie@example.com',
      status: 'OK',
      createdAt: '2026-01-03T00:00:00Z',
      updatedAt: '2026-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    const db = createTestDatabase(data);
    repository = new InMemoryUserRepository(db);
  });

  describe('findAll', () => {
    it('should return all users when no filter is provided', async () => {
      const users = await repository.findAll();

      expect(users).toHaveLength(3);
      expect(users).toEqual(expect.arrayContaining(data));
    });

    it('should filter users by status', async () => {
      const okUsers = await repository.findAll({ status: 'OK' });

      expect(okUsers).toHaveLength(2);
      expect(okUsers.every(u => u.status === 'OK')).toBe(true);
    });

    it('should return empty array when status has no matches', async () => {
      const deletedUsers = await repository.findAll({ status: 'DELETED' });

      expect(deletedUsers).toEqual([]);
    });

    it('should return empty array when repository is empty', async () => {
      const emptyDb = createTestDatabase();
      const emptyRepo = new InMemoryUserRepository(emptyDb);
      const users = await emptyRepo.findAll();

      expect(users).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a user when ID exists', async () => {
      const found = await repository.findById('user-1');

      expect(found).toBeDefined();
      expect(found?.id).toBe('user-1');
      expect(found?.email).toBe('alice@example.com');
    });

    it('should return null when ID does not exist', async () => {
      const found = await repository.findById('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user when email exists', async () => {
      const found = await repository.findByEmail('bob@example.com');

      expect(found).toBeDefined();
      expect(found?.id).toBe('user-2');
      expect(found?.firstName).toBe('Bob');
    });

    it('should return null when email does not exist', async () => {
      const found = await repository.findByEmail('nonexistent@example.com');

      expect(found).toBeNull();
    });

    it('should be case-sensitive', async () => {
      const found = await repository.findByEmail('ALICE@EXAMPLE.COM');

      expect(found).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user with valid data', async () => {
      const newUserData: t_CreateUserRequestBodySchema = {
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david@example.com',
      };

      const createdUser = await repository.create(newUserData);

      expect(createdUser.id).toBeDefined();
      expect(createdUser.firstName).toBe(newUserData.firstName);
      expect(createdUser.lastName).toBe(newUserData.lastName);
      expect(createdUser.email).toBe(newUserData.email);
      expect(createdUser.status).toBe('OK');
      expect(createdUser.createdAt).toBeDefined();
      expect(createdUser.updatedAt).toBeDefined();
    });

    it('should generate unique IDs for multiple users', async () => {
      const user1 = await repository.create({
        firstName: 'User',
        lastName: 'One',
        email: 'user1@example.com',
      });

      const user2 = await repository.create({
        firstName: 'User',
        lastName: 'Two',
        email: 'user2@example.com',
      });

      expect(user1.id).not.toBe(user2.id);
    });

    it('should store the created user', async () => {
      const newUser = await repository.create({
        firstName: 'Eve',
        lastName: 'Davis',
        email: 'eve@example.com',
      });

      const found = await repository.findById(newUser.id!);

      expect(found).toEqual(newUser);
    });

    it('should include payment method when provided', async () => {
      const newUser = await repository.create({
        firstName: 'Frank',
        lastName: 'Miller',
        email: 'frank@example.com',
        paymentMethod: {
          type: 'SEPA',
          iban: 'FR76****************1234',
        },
      });

      expect(newUser.paymentMethod).toBeDefined();
      expect(newUser.paymentMethod?.type).toBe('SEPA');
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const updateData: t_UpdateUserRequestBodySchema = {
        firstName: 'Alicia',
        lastName: 'J.',
      };
      
      const updatedUser = await repository.update('user-1', updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firstName).toBe('Alicia');
      expect(updatedUser?.lastName).toBe('J.');
      expect(updatedUser?.email).toBe('alice@example.com'); // Unchanged
      expect(updatedUser?.id).toBe('user-1'); // ID preserved
      expect(updatedUser?.updatedAt).not.toBe('2026-01-01T00:00:00Z'); // updatedAt changed
    });

    it('should return null when updating non-existent user', async () => {
      const result = await repository.update('non-existent', { firstName: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete a user (mark as BLOQUE)', async () => {
      const result = await repository.delete('user-1');

      expect(result).toBe(true);

      const deletedUser = await repository.findById('user-1');
      expect(deletedUser?.status).toBe('BLOQUE');
    });

    it('should return false when deleting non-existent user', async () => {
      const result = await repository.delete('non-existent-id');

      expect(result).toBe(false);
    });

    it('should update the updatedAt timestamp on delete', async () => {
      const originalUser = await repository.findById('user-1');
      const originalUpdatedAt = originalUser?.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      await repository.delete('user-1');

      const deletedUser = await repository.findById('user-1');
      expect(deletedUser?.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should keep user data except status', async () => {
      await repository.delete('user-1');

      const deletedUser = await repository.findById('user-1');
      expect(deletedUser?.email).toBe('alice@example.com');
      expect(deletedUser?.firstName).toBe('Alice');
      expect(deletedUser?.status).toBe('BLOQUE');
    });
  });

  describe('updateStatus', () => {
    it('should update user status', async () => {
      const updatedUser = await repository.updateStatus('user-1', 'SUSPENDED');

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.status).toBe('SUSPENDED');
      expect(updatedUser?.id).toBe('user-1');
    });

    it('should return null when updating status of non-existent user', async () => {
      const result = await repository.updateStatus('non-existent', 'SUSPENDED');

      expect(result).toBeNull();
    });

    it('should allow all valid status values', async () => {
      const statuses: Array<t_UserStatus> = ['OK', 'SUSPENDED', 'BLOQUE', 'DELETED'];

      for (const status of statuses) {
        const updated = await repository.updateStatus('user-1', status);
        expect(updated?.status).toBe(status);
      }
    });
  });
});
