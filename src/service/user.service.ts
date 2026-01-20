import type { UserRepository } from '../repository/user.repository';
import type {
    t_User,
    t_CreateUserRequestBodySchema,
    t_UpdateUserRequestBodySchema,
    t_UserStatus,
} from '../../api/models';

export class UserService {
    constructor(private readonly repository: UserRepository) {}

    async list(query?: { status?: t_UserStatus }): Promise<t_User[]> {
        return this.repository.findAll(query);
    }

    async getById(id: string): Promise<t_User | null> {
        return this.repository.findById(id);
    }

    async create(data: t_CreateUserRequestBodySchema): Promise<t_User> {
        return this.repository.create(data);
    }

    async update(id: string, data: t_UpdateUserRequestBodySchema): Promise<t_User | null> {
        return this.repository.update(id, data);
    }

    async delete(id: string): Promise<boolean> {
        return this.repository.delete(id);
    }

    async updateStatus(id: string, status: t_UserStatus): Promise<t_User | null> {
        return this.repository.updateStatus(id, status);
    }
}
