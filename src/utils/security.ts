import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { t_User, t_Admin } from '../../api/models';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it';
const JWT_EXPIRES_IN = '24h';

/**
 * Connect compatible JWT payload format
 * Connect expects exactly: userId, permission, exp (exp is auto-added by jwt.sign)
 */
interface ConnectJwtPayload {
    userId: string;
    permission: number;
}

/**
 * Internal user payload with derived userType
 * Used internally after decoding JWT
 */
export interface UserPayload {
    userId: string;
    userType: 'user' | 'admin'; // we use userType for auth middleware
    permission: number;
}

export const security = {
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    },

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    },

    generateToken(user: t_User): string {
        const payload: ConnectJwtPayload = {
            userId: user.id || '',
            permission: 1, // Authenticated
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    },

    generateAdminToken(admin: t_Admin): string {
        const payload: ConnectJwtPayload = {
            userId: admin.id || '',
            permission: 2, // Admin
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    },

    verifyToken(token: string): UserPayload {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as ConnectJwtPayload;
            return {
                userId: decoded.userId,
                userType: decoded.permission >= 2 ? 'admin' : 'user',
                permission: decoded.permission,
            };
        } catch (error) {
            throw new Error('Invalid token');
        }
    },
};
