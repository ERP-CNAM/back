import type { Login } from '../../../api/generated';
import type { AuthService } from '../../service/auth.service';

/**
 * Creates the authentication handlers
 * 
 * @param authService The auth service
 * 
 * @returns The authentication handlers
 */
export const createAuthHandlers = (authService: AuthService) => {
    /**
     * Logs in a user
     * 
     * @route POST /auth/login
     * 
     * @param params The request parameters
     * @param respond The response handler
     * @param req The request object
     * 
     * @returns The response object
     */
    const login: Login = async (params, respond, req) => {
        const result = await authService.login(params.body);

        if (!result.success) {
            req.log.warn({ email: params.body.email }, `Login failed: ${result.reason}`);
            return respond.with401().body({
                success: false,
                message: 'Invalid credentials',
                payload: null,
            });
        }

        const { user, token } = result;

        req.log.info({ email: params.body.email, userId: user!.id }, 'User logged in successfully');

        return respond.with200().body({
            success: true,
            message: 'Login successful',
            payload: {
                token: token!,
                user: user!,
            },
        });
    };

    return { login };
};
