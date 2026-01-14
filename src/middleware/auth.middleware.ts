import { security } from '../utils/security';
import { getAccessLevel } from './routes.config';

/**
 * Authentication and Authorization Middleware
 * Uses routes.config.ts to determine access levels
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

    // User already authenticated via Connect middleware
    if (req.user) {
        return authorizeAndProceed(req.user, accessLevel, res, next);
    }

    // Authenticate via Bearer token
    return authenticateWithToken(req, res, next, accessLevel);
};

const shouldBypassAuth = (path: string): boolean => {
    return path.startsWith('/swagger');
};

const authorizeAndProceed = (user: any, accessLevel: string, res: any, next: any) => {
    if (accessLevel === 'admin' && user.userType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied',
        });
    }
    return next();
};

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

const extractToken = (req: any): string | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};

const attachUserContext = (req: any, user: any) => {
    req.user = user;

    if (req.log) {
        req.log = req.log.child({
            userId: user.userId,
            userType: user.userType,
        });
    }
};
