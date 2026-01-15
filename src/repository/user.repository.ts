import type {
    t_User,
    t_UserStatus,
    t_CreateUserRequestBodySchema,
    t_UpdateUserRequestBodySchema,
} from '../../api/models';

export interface UserQueryOptions {
    status?: t_UserStatus;
}

export type UserWithPassword = t_User & { password?: string };

/**
 * Repository interface for User entity
 */
export interface UserRepository {
    /**
     * Finds all users
     * 
     * @param options The query options (status)
     * @returns All users matching the filter
     */
    findAll(options?: UserQueryOptions): Promise<t_User[]>;

    /**
     * Finds a user by id
     * 
     * @param id The id of the user
     * @returns The user
     */
    findById(id: string): Promise<t_User | null>;

    /**
     * Finds a user by email
     * 
     * @param email The email of the user
     * @returns The user
     */
    findByEmail(email: string): Promise<t_User | null>;

    /**
     * Finds a user by email with password
     * 
     * @param email The email of the user
     * @returns The user with password
     */
    findWithPasswordByEmail(email: string): Promise<UserWithPassword | null>;

    /**
     * Creates a user
     * 
     * @param data The user data
     * @returns The created user
     */
    create(data: t_CreateUserRequestBodySchema): Promise<t_User>;

    /**
     * Updates a user
     * 
     * @param id The id of the user
     * @param data The user data
     * @returns The updated user
     */
    update(id: string, data: t_UpdateUserRequestBodySchema): Promise<t_User | null>;

    /**
     * Deletes a user
     * 
     * @param id The id of the user
     * @returns True if the user was deleted, false otherwise
     */
    delete(id: string): Promise<boolean>;

    /**
     * Updates the status of a user
     * 
     * @param id The id of the user
     * @param status The new status
     * @returns The updated user
     */
    updateStatus(id: string, status: t_UserStatus): Promise<t_User | null>;
}
