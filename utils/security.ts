import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { t_User } from '../api/models';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it';
const JWT_EXPIRES_IN = '24h';

export interface UserPayload {
    userId: string;
    email: string;
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
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    },

    verifyToken(token: string): string | jwt.JwtPayload {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    },
};
