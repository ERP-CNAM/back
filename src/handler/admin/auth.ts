import type { AdminLogin } from '../../../api/generated';
import type { AdminRepository } from '../../repository/admin.repository';
import { security } from '../../utils/security';

/**
 * Creates the admin authentication handlers
 * 
 * @param adminRepository The admin repository
 * @returns The admin authentication handlers
 */
export const createAdminAuthHandlers = (adminRepository: AdminRepository) => {

    /**
     * Logs in an admin
     * 
     * @route POST /auth/admin/login
     * 
     * @param params The request parameters
     * @param respond The response handler
     * @param req The request object
     * 
     * @returns The response object
     */
    const adminLogin: AdminLogin = async (params, respond, req) => {
        const { email, password } = params.body;

        const admin = await adminRepository.findWithPasswordByEmail(email);

        if (!admin || !admin.password) {
            (req as any).log.warn({ email }, 'Admin login failed: admin not found');
            return respond.with401().body({
                success: false,
                message: 'Invalid credentials',
                payload: null,
            });
        }

        if (admin.isActive !== 'true') {
            (req as any).log.warn({ email }, 'Admin login failed: account inactive');
            return respond.with401().body({
                success: false,
                message: 'Account inactive',
                payload: null,
            });
        }

        const isValid = await security.verifyPassword(password, admin.password);
        if (!isValid) {
            (req as any).log.warn({ email }, 'Admin login failed: invalid password');
            return respond.with401().body({
                success: false,
                message: 'Invalid credentials',
                payload: null,
            });
        }

        const token = security.generateAdminToken(admin);

        await adminRepository.updateLastLogin(admin.id!);

        const { password: _, ...adminWithoutPassword } = admin;

        (req as any).log.info({ email, adminId: admin.id }, 'Admin logged in successfully');

        return respond.with200().body({
            success: true,
            message: 'Admin login successful',
            payload: {
                token,
                admin: adminWithoutPassword,
            },
        });
    };

    return { adminLogin };
};
