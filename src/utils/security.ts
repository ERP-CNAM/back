import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { t_User, t_Admin } from '../../api/models';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it';
const JWT_EXPIRES_IN = '24h';

export interface UserPayload {
    userId: string;
    email: string;
    userType: 'user' | 'admin';
}

export const security = {
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    },

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    },

    generateToken(user: t_User): string {
        const payload: UserPayload = {
            userId: user.id || '',
            email: user.email || '',
            userType: 'user',
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    },

    generateAdminToken(admin: t_Admin): string {
        const payload: UserPayload = {
            userId: admin.id || '',
            email: admin.email || '',
            userType: 'admin',
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    },

    verifyToken(token: string): UserPayload {
        try {
            return jwt.verify(token, JWT_SECRET) as UserPayload;
        } catch (error) {
            throw new Error('Invalid token');
        }
    },
};
