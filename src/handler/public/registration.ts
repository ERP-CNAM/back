import type { CreateUser } from '../../../api/generated';
import type { UserRepository } from '../../repository/user.repository';

export function createRegistrationHandlers(repository: UserRepository) {
    // POST /users
    const createUser: CreateUser = async (params, respond) => {
        const userData = params.body;

        const newUser = await repository.create(userData);

        return respond.with201().body({
            success: true,
            message: 'User created successfully',
            payload: newUser,
        });
    };

    return {
        createUser,
    };
}
