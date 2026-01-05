import type {
  t_User,
  t_UserStatus,
  t_CreateUserRequestBodySchema,
  t_UpdateUserRequestBodySchema,
} from '../api/models';

export interface UserQueryOptions {
  status?: t_UserStatus;
}

/**
 * Repository interface for User entity
 */
export interface UserRepository {
  findAll(options?: UserQueryOptions): Promise<t_User[]>;
  findById(id: string): Promise<t_User | null>;
  findByEmail(email: string): Promise<t_User | null>;
  create(data: t_CreateUserRequestBodySchema): Promise<t_User>;
  update(id: string, data: t_UpdateUserRequestBodySchema): Promise<t_User | null>;
  delete(id: string): Promise<boolean>;
  updateStatus(id: string, status: t_UserStatus): Promise<t_User | null>;
}
