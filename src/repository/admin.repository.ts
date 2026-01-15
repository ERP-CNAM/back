import type { t_Admin } from '../../api/models';

export type AdminWithPassword = t_Admin & { password?: string };

export interface AdminRepository {
    /**
     * Finds all admins
     * 
     * @returns All admins
     */
    findAll(): Promise<t_Admin[]>;

    /**
     * Finds an admin by id
     * 
     * @param id The id of the admin
     * @returns The admin
     */
    findById(id: string): Promise<t_Admin | null>;

    /**
     * Finds an admin by email
     * 
     * @param email The email of the admin
     * @returns The admin
     */
    findByEmail(email: string): Promise<t_Admin | null>;

    /**
     * Finds an admin by email with password
     * 
     * @param email The email of the admin
     * @returns The admin with password
     */
    findWithPasswordByEmail(email: string): Promise<AdminWithPassword | null>;

    /**
     * Creates an admin
     * 
     * @param data The admin data
     * @returns The created admin
     */
    create(data: { email: string; password: string; firstName: string; lastName: string }): Promise<t_Admin>;

    /**
     * Updates the last login of an admin
     * 
     * @param id The id of the admin
     */
    updateLastLogin(id: string): Promise<void>;
}
