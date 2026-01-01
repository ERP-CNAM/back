import type {
  IUserRepository,
  UserQueryOptions,
  CreateUserData,
  UpdateUserData
} from '../../interfaces/IUserRepository';
import type { t_User, t_UserStatus } from '../../../server/models';
import { generateUUID } from '../../../utils/uuid';

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, t_User>;

  constructor(initialData: t_User[] = []) {
    this.users = new Map();
    initialData.forEach(user => {
      this.users.set(user.id!, user);
    });
  }

  async findAll(options?: UserQueryOptions): Promise<t_User[]> {
    let results = Array.from(this.users.values());

    if (options?.status) {
      results = results.filter(u => u.status === options.status);
    }

    return results;
  }

  async findById(id: string): Promise<t_User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<t_User | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return user || null;
  }

  async create(data: CreateUserData): Promise<t_User> {
    const newUser: t_User = {
      id: generateUUID(),
      ...data,
      status: 'OK',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(newUser.id!, newUser);

    return newUser;
  }

  async update(id: string, data: UpdateUserData): Promise<t_User | null> {
    const existingUser = this.users.get(id);

    if (!existingUser) {
      return null;
    }

    const updatedUser: t_User = {
      ...existingUser,
      ...data,
      id, // Preserve original ID
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, updatedUser);

    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const user = this.users.get(id);

    if (!user) {
      return false;
    }

    const deletedUser: t_User = {
      ...user,
      status: 'BLOQUE',
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, deletedUser);

    return true;
  }

  async updateStatus(id: string, status: t_UserStatus): Promise<t_User | null> {
    return this.update(id, { status });
  }
}
