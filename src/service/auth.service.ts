import type { UserRepository } from '../repository/user.repository';
import type { AdminRepository } from '../repository/admin.repository';
import type { SubscriptionRepository } from '../repository/subscription.repository';
import { security } from '../utils/security';
import type { t_LoginRequestBodySchema, t_AdminLoginRequestBodySchema } from '../../api/models';

export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly adminRepository: AdminRepository,
        private readonly subscriptionRepository: SubscriptionRepository,
    ) { }

    async login(credentials: t_LoginRequestBodySchema) {
        const { email, password } = credentials;

        const user = await this.userRepository.findWithPasswordByEmail(email);

        if (!user || !user.password) {
            return { success: false, reason: 'User not found or no password' };
        }

        const isValid = await security.verifyPassword(password, user.password);
        if (!isValid) {
            return { success: false, reason: 'Invalid password' };
        }
        const isSubscribed = await this.subscriptionRepository.hasActiveSubscription(user.id!);

        const token = security.generateToken(user);
        const { password: _, ...userWithoutPassword } = user;

        return {
            success: true,
            user: {
                ...userWithoutPassword,
                isSubscribed,
            },
            token
        };
    }

    async adminLogin(credentials: t_AdminLoginRequestBodySchema) {
        const { email, password } = credentials;

        const admin = await this.adminRepository.findWithPasswordByEmail(email);

        if (!admin || !admin.password) {
            return { success: false, reason: 'Admin not found' };
        }

        if (admin.isActive !== 'true') {
            return { success: false, reason: 'Account inactive' };
        }

        const isValid = await security.verifyPassword(password, admin.password);
        if (!isValid) {
            return { success: false, reason: 'Invalid password' };
        }

        const token = security.generateAdminToken(admin);
        await this.adminRepository.updateLastLogin(admin.id!);

        const { password: _, ...adminWithoutPassword } = admin;

        return {
            success: true,
            admin: adminWithoutPassword,
            token,
        };
    }
}
