import type { AdminLogin } from '../../api/generated';
import type { AdminRepository } from '../repository/admin.repository';
import { security } from '../utils/security';

export const createAdminAuthHandlers = (adminRepository: AdminRepository) => {
    const adminLogin: AdminLogin = async (params, respond) => {
        const { email, password } = params.body;

        const admin = await adminRepository.findWithPasswordByEmail(email);

        if (!admin || !admin.password) {
            return respond.with401();
        }

        if (admin.isActive !== 'true') {
            return respond.with401();
        }

        const isValid = await security.verifyPassword(password, admin.password);
        if (!isValid) {
            return respond.with401();
        }

        const token = security.generateAdminToken(admin);

        await adminRepository.updateLastLogin(admin.id!);

        const { password: _, ...adminWithoutPassword } = admin;

        return respond.with200().body({
            success: true,
            message: 'Connexion administrateur réussie',
            payload: {
                token,
                admin: adminWithoutPassword,
            },
        });
    };

    return { adminLogin };
};
