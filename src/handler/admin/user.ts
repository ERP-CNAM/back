import type { ListUsers, GetUser, UpdateUser, DeleteUser, UpdateUserStatus } from '../../../api/generated';
import type { UserService } from '../../service/user.service';

/**
 * Creates the user handlers
 *
 *
 * @returns The user handlers
 * @param userService
 */
export function createUserHandlers(userService: UserService) {
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
        const queryOptions = params.query || {};

        const users = await userService.list(queryOptions);

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
     * @param req The express request
     *
     * @returns The response object
     */
    const getUser: GetUser = async (params, respond, req) => {
        const { userId } = params.params;
        const currentUser = (req as any).user;

        // Security check: non-admins can only access their own profile
        if (currentUser.permission < 2 && currentUser.userId !== userId) {
            return respond.with403().body({
                success: false,
                message: 'Access denied',
            });
        }

        const user = await userService.getById(userId);

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
     * @param req The express request
     *
     * @returns The response object
     */
    const updateUser: UpdateUser = async (params, respond, req) => {
        const { userId } = params.params;
        const currentUser = (req as any).user;
        const updates = params.body;

        // Security check: non-admins can only update their own profile
        if (currentUser.permission < 2 && currentUser.userId !== userId) {
            return respond.with403().body({
                success: false,
                message: 'Access denied',
            });
        }

        const updatedUser = await userService.update(userId, updates);

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

        const deleted = await userService.delete(userId);

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
            const user = await userService.getById(userId);
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

        const updatedUser = await userService.updateStatus(userId, status);

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
