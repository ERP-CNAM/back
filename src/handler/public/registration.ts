import type { CreateUser } from '../../../api/generated';
import type { UserRepository } from '../../repository/user.repository';

/**
 * Creates the registration handlers
 * 
 * @param repository The user repository
 * 
 * @returns The registration handlers
 */
export function createRegistrationHandlers(repository: UserRepository) {
    /**
     * Creates a user
     * 
     * @route POST /users
     * 
     * @param params The request parameters
     * @param respond The response handler
     * 
     * @returns The response object
     */
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
