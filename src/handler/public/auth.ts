import type { Login } from '../../../api/generated';
import type { UserRepository } from '../../repository/user.repository';
import { security } from '../../utils/security';

/**
 * Creates the authentication handlers
 * 
 * @param userRepository The user repository
 * 
 * @returns The authentication handlers
 */
export const createAuthHandlers = (userRepository: UserRepository) => {
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
        const { email, password } = params.body;

        const user = await userRepository.findWithPasswordByEmail(email);

        if (!user || !user.password) {
            (req as any).log.warn({ email }, 'Login failed: user not found or no password');
            return respond.with401().body({
                success: false,
                message: 'Invalid credentials',
                payload: null,
            });
        }

        const isValid = await security.verifyPassword(password, user.password);
        if (!isValid) {
            (req as any).log.warn({ email }, 'Login failed: invalid password');
            return respond.with401().body({
                success: false,
                message: 'Invalid credentials',
                payload: null,
            });
        }

        const token = security.generateToken(user);

        const { password: _, ...userWithoutPassword } = user;

        (req as any).log.info({ email, userId: user.id }, 'User logged in successfully');

        return respond.with200().body({
            success: true,
            message: 'Login successful',
            payload: {
                token,
                user: userWithoutPassword,
            },
        });
    };

    return { login };
};
