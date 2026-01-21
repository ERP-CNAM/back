import type { CreateUser } from '../../../api/generated';
import type { UserService } from '../../service/user.service';

/**
 * Creates the registration handlers
 *
 * @param userService
 * @returns The registration handlers
 */
export function createRegistrationHandlers(userService: UserService) {
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

        const newUser = await userService.create(userData);

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
