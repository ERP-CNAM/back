import type { ListUsers, GetUser, UpdateUser, DeleteUser, UpdateUserStatus } from '../../../api/generated';
import type { UserRepository } from '../../repository/user.repository';

/**
 * Creates the user handlers
 * 
 * @param repository The user repository
 * 
 * @returns The user handlers
 */
export function createUserHandlers(repository: UserRepository) {
    /**
     * Lists the users
     * 
     * @route GET /users
     * 
     * @param params The request parameters
     * @param respond The response handler
     * 
     * @returns The response object
     */
    const listUsers: ListUsers = async (params, respond) => {
        // Admin check is handled by auth middleware via routes.config.ts
        const queryOptions = params.query || {};

        const users = await repository.findAll(queryOptions);

        return respond.with200().body({
            success: true,
            message: 'Users retrieved successfully',
            payload: users,
        });
    };

    /**
     * Gets the user
     * 
     * @route GET /users/{userId}
     * 
     * @param params The request parameters
     * @param respond The response handler
     * 
     * @returns The response object
     */
    const getUser: GetUser = async (params, respond) => {
        const { userId } = params.params;

        const user = await repository.findById(userId);

        if (!user) {
            return respond.with404().body({
                success: false,
                message: 'User not found',
                payload: null,
            });
        }

        return respond.with200().body({
            success: true,
            message: 'User details retrieved successfully',
            payload: user,
        });
    };

    /**
     * Updates the user
     * 
     * @route PUT /users/{userId}
     * 
     * @param params The request parameters
     * @param respond The response handler
     * 
     * @returns The response object
     */
    const updateUser: UpdateUser = async (params, respond) => {
        const { userId } = params.params;
        const updates = params.body;

        const updatedUser = await repository.update(userId, updates);

        if (!updatedUser) {
            return respond.with404().body({
                success: false,
                message: 'User not found',
                payload: null,
            });
        }

        return respond.with200().body({
            success: true,
            message: 'User updated successfully',
            payload: updatedUser,
        });
    };

    /**
     * Deletes the user
     * 
     * @route DELETE /users/{userId}
     * 
     * @param params The request parameters
     * @param respond The response handler
     * 
     * @returns The response object
     */
    const deleteUser: DeleteUser = async (params, respond) => {
        const { userId } = params.params;

        const deleted = await repository.delete(userId);

        if (!deleted) {
            return respond.with404().body({
                success: false,
                message: 'User not found',
                payload: null,
            });
        }

        return respond.with200().body({
            success: true,
            message: 'User deleted successfully',
            payload: null,
        });
    };

    /**
     * Updates the user status
     * 
     * @route PATCH /users/{userId}/status
     * 
     * @param params The request parameters
     * @param respond The response handler
     * 
     * @returns The response object
     */
    const updateUserStatus: UpdateUserStatus = async (params, respond) => {
        const { userId } = params.params;
        const { status } = params.body;

        if (!status) {
            const user = await repository.findById(userId);
            if (!user) {
                return respond.with404().body({
                    success: false,
                    message: 'User not found',
                    payload: null,
                });
            }
            return respond.with200().body({
                success: true,
                message: 'User status unchanged',
                payload: user,
            });
        }

        const updatedUser = await repository.updateStatus(userId, status);

        if (!updatedUser) {
            return respond.with404().body({
                success: false,
                message: 'User not found',
                payload: null,
            });
        }

        return respond.with200().body({
            success: true,
            message: 'User status updated successfully',
            payload: updatedUser,
        });
    };

    return {
        listUsers,
        getUser,
        updateUser,
        deleteUser,
        updateUserStatus,
    };
}
