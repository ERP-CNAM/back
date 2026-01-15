import { security } from '../utils/security';
import { getAccessLevel } from './routes.config';

/**
 * Authentication and Authorization Middleware.
 *
 * Handles three access paths:
 * - **Gateway**: User authenticated via Connect, `req.user` already set.
 * - **S2S**: Internal service with valid API key, `req.isConnectRequest = true`.
 * - **Direct (SPA)**: Backoffice access, validates JWT from Authorization header.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authMiddleware = (req: any, res: any, next: any) => {
    const path = req.path;
    const method = req.method;

    if (shouldBypassAuth(path)) {
        return next();
    }

    const accessLevel = getAccessLevel(path, method);

    if (accessLevel === 'public') {
        return next();
    }

    // S2S call - trusted via API key validation
    if (req.isConnectRequest) {
        return next();
    }

    // User authenticated via Connect Gateway
    if (req.user) {
        return authorizeAndProceed(req.user, accessLevel, res, next);
    }

    // Direct access - validate JWT (internal login system for SPA)
    return authenticateWithToken(req, res, next, accessLevel);
};

/**
 * Checks if authentication should be bypassed for this path.
 *
 * @param path - The request path
 * @returns `true` for utility routes like Swagger docs
 */
const shouldBypassAuth = (path: string): boolean => {
    return path.startsWith('/swagger');
};

/**
 * Checks if the user has sufficient permissions for the route.
 *
 * @param user - The authenticated user payload
 * @param accessLevel - Required access level ('public', 'authenticated', 'admin')
 * @param res - Express response object
 * @param next - Express next function
 * @returns Response with 403 if access denied, otherwise calls next()
 */
const authorizeAndProceed = (user: any, accessLevel: string, res: any, next: any) => {
    if (accessLevel === 'admin' && user.userType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied',
        });
    }
    return next();
};

/**
 * Validates JWT from Authorization header for direct API access.
 *
 * This is the internal login system used by the SPA/Backoffice.
 * Extracts the Bearer token, verifies it, and attaches user to request.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @param accessLevel - Required access level for authorization check
 */
const authenticateWithToken = (req: any, res: any, next: any, accessLevel: string) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
    }

    try {
        const user = security.verifyToken(token);
        attachUserContext(req, user);
        return authorizeAndProceed(user, accessLevel, res, next);
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};

/**
 * Extracts JWT from the Authorization header.
 *
 * Expected format: `Authorization: Bearer <token>`
 *
 * @param req - Express request object
 * @returns The JWT string, or `null` if not present or malformed
 */
const extractToken = (req: any): string | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};

/**
 * Attaches the authenticated user to the request and enriches logging context.
 *
 * @param req - Express request object
 * @param user - The decoded user payload from JWT
 */
const attachUserContext = (req: any, user: any) => {
    req.user = user;

    if (req.log) {
        req.log = req.log.child({
            userId: user.userId,
            userType: user.userType,
        });
    }
};
