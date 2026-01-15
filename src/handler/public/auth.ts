import type { Login } from '../../../api/generated';
import type { UserRepository } from '../../repository/user.repository';
import { security } from '../../utils/security';

export const createAuthHandlers = (userRepository: UserRepository) => {
    // POST /auth/login
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
