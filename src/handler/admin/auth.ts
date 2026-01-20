import type { AdminLogin } from '../../../api/generated';
import type { AuthService } from '../../service/auth.service';

/**
 * Creates the admin authentication handlers
 *
 * @param authService The auth service
 * @returns The admin authentication handlers
 */
export const createAdminAuthHandlers = (authService: AuthService) => {
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
        const result = await authService.adminLogin(params.body);

        if (!result.success) {
            (req as any).log.warn({ email: params.body.email }, `Admin login failed: ${result.reason}`);
            return respond.with401().body({
                success: false,
                message: result.reason === 'Account inactive' ? 'Account inactive' : 'Invalid credentials',
                payload: null,
            });
        }

        const { admin, token } = result;

        (req as any).log.info({ email: params.body.email, adminId: admin!.id }, 'Admin logged in successfully');

        return respond.with200().body({
            success: true,
            message: 'Admin login successful',
            payload: {
                token: token!,
                admin: admin!,
            },
        });
    };

    return { adminLogin };
};
