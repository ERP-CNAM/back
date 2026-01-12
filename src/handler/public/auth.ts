import type { Login } from '../../../api/generated';
import type { UserRepository } from '../../repository/user.repository';
import { security } from '../../utils/security';

export const createAuthHandlers = (userRepository: UserRepository) => {
    const login: Login = async (params, respond) => {
        const { email, password } = params.body;

        const user = await userRepository.findWithPasswordByEmail(email);

        if (!user || !user.password) {
            return respond.with401();
        }

        const isValid = await security.verifyPassword(password, user.password);
        if (!isValid) {
            return respond.with401();
        }

        const token = security.generateToken(user);

        const { password: _, ...userWithoutPassword } = user;

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
