import type { t_User, t_UserStatus, t_PaymentMethod } from '../server/models';

export interface UserQueryOptions {
  status?: t_UserStatus;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  paymentMethod?: t_PaymentMethod;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  paymentMethod?: t_PaymentMethod;
  status?: t_UserStatus;
}

/**
 * Repository interface for User entity
 */
export interface UserRepository {
  findAll(options?: UserQueryOptions): Promise<t_User[]>;
  findById(id: string): Promise<t_User | null>;
  findByEmail(email: string): Promise<t_User | null>;
  create(data: CreateUserData): Promise<t_User>;
  update(id: string, data: UpdateUserData): Promise<t_User | null>;
  delete(id: string): Promise<boolean>;
  updateStatus(id: string, status: t_UserStatus): Promise<t_User | null>;
}
