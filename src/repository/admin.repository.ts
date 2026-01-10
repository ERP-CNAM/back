import type { t_Admin } from '../../api/models';

export type AdminWithPassword = t_Admin & { password?: string };

/**
 * Repository interface for Admin entity
 */
export interface AdminRepository {
    findAll(): Promise<t_Admin[]>;

    findById(id: string): Promise<t_Admin | null>;

    findByEmail(email: string): Promise<t_Admin | null>;

    findWithPasswordByEmail(email: string): Promise<AdminWithPassword | null>;

    create(data: { email: string; password: string; firstName: string; lastName: string }): Promise<t_Admin>;

    updateLastLogin(id: string): Promise<void>;
}
