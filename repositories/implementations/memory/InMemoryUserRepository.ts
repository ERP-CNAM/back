import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import type {
  IUserRepository,
  UserQueryOptions,
  CreateUserData,
  UpdateUserData
} from '../../interfaces/IUserRepository';
import type { t_User, t_UserStatus } from '../../../server/models';
import { users } from '../../../database/memory/schema';
import { generateUUID } from '../../../utils/uuid';

export class InMemoryUserRepository implements IUserRepository {
  constructor(private db: BetterSQLite3Database) {}

  private toUser(row: any): t_User {
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      status: row.status,
      paymentMethod: row.paymentMethod ? JSON.parse(row.paymentMethod) : undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findAll(options?: UserQueryOptions): Promise<t_User[]> {
    let query = this.db.select().from(users);

    if (options?.status) {
      query = query.where(eq(users.status, options.status)) as any;
    }

    return query.all().map(row => this.toUser(row));
  }

  async findById(id: string): Promise<t_User | null> {
    const rows = this.db.select().from(users).where(eq(users.id, id)).limit(1).all();
    return rows.length > 0 ? this.toUser(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<t_User | null> {
    const rows = this.db.select().from(users).where(eq(users.email, email)).limit(1).all();
    return rows.length > 0 ? this.toUser(rows[0]) : null;
  }

  async create(data: CreateUserData): Promise<t_User> {
    const newUser: t_User = {
      id: generateUUID(),
      ...data,
      status: 'OK',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.insert(users).values({
      id: newUser.id!,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      paymentMethod: newUser.paymentMethod ? JSON.stringify(newUser.paymentMethod) : null,
      status: newUser.status,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    }).run();

    return newUser;
  }

  async update(id: string, data: UpdateUserData): Promise<t_User | null> {
    const existingUser = await this.findById(id);

    if (!existingUser) {
      return null;
    }

    const updatedUser: t_User = {
      ...existingUser,
      ...data,
      id, // Preserve original ID
      updatedAt: new Date().toISOString(),
    };

    this.db.update(users).set({
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      paymentMethod: updatedUser.paymentMethod ? JSON.stringify(updatedUser.paymentMethod) : null,
      status: updatedUser.status,
      updatedAt: updatedUser.updatedAt,
    }).where(eq(users.id, id)).run();

    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) return false;

    this.db.update(users).set({
      status: 'BLOQUE',
      updatedAt: new Date().toISOString(),
    }).where(eq(users.id, id)).run();

    return true;
  }

  async updateStatus(id: string, status: t_UserStatus): Promise<t_User | null> {
    return this.update(id, { status });
  }
}
