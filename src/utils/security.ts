import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { t_User, t_Admin } from '../../api/models';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it';
const JWT_EXPIRES_IN = '24h';

/**
 * JWT payload format compatible with Connect Gateway.
 *
 * Permission levels:
 * - `0` - Public (no authentication required)
 * - `1` - Authenticated user
 * - `2` - Admin
 */
interface ConnectJwtPayload {
    userId: string;
    permission: number;
}

/**
 * Internal user payload attached to `req.user` after authentication.
 *
 * The `userType` field is derived from `permission` for easier role checking.
 */
export interface UserPayload {
    userId: string;
    userType: 'user' | 'admin';
    permission: number;
}

/**
 * Security utilities for password hashing and JWT token management.
 *
 * Tokens generated here are validated by:
 * - Connect Gateway (for external users via the gateway)
 * - `verifyToken()` (for SPA/Backoffice direct access)
 */
export const security = {
    /**
     * Hashes a password using bcrypt.
     *
     * @param password - Plain text password to hash
     * @returns Promise resolving to the hashed password string
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    },

    /**
     * Verifies a password against a bcrypt hash.
     *
     * @param password - Plain text password to verify
     * @param hash - Stored bcrypt hash to compare against
     * @returns Promise resolving to `true` if password matches
     */
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    },

    /**
     * Generates a JWT token for an authenticated user.
     *
     * Creates a token with `permission: 1` (authenticated user level).
     *
     * @param user - The authenticated user object from the database
     * @returns Signed JWT token string
     */
    generateToken(user: t_User): string {
        const payload: ConnectJwtPayload = {
            userId: user.id || '',
            permission: 1,
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    },

    /**
     * Generates a JWT token for an authenticated admin.
     *
     * Creates a token with `permission: 2` (admin level).
     *
     * @param admin - The authenticated admin object from the database
     * @returns Signed JWT token string
     */
    generateAdminToken(admin: t_Admin): string {
        const payload: ConnectJwtPayload = {
            userId: admin.id || '',
            permission: 2,
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    },

    /**
     * Verifies and decodes a JWT token (internal login system).
     *
     * Used by `auth.middleware` for direct SPA/Backoffice access.
     *
     * @param token - The JWT token string to verify
     * @returns Decoded user payload with `userId`, `userType`, and `permission`
     * @throws Error if the token is invalid or expired
     */
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
