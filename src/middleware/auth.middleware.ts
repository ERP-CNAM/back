import { security } from '../utils/security';
import { getAccessLevel } from './routes.config';

/**
 * Authentication and Authorization Middleware
 * Uses routes.config.ts to determine access levels
 */
export const authMiddleware = (req: any, res: any, next: any) => {
    const path = req.path;
    const method = req.method;

    // Skip swagger UI
    if (path.startsWith('/swagger')) {
        return next();
    }

    // Get access level for this route using routes.config helpers
    const accessLevel = getAccessLevel(path, method);

    // Public routes - no auth needed
    if (accessLevel === 'public') {
        return next();
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const user = security.verifyToken(token);
        (req as any).user = user;

        // Enrich the logger with user context
        if ((req as any).log) {
            (req as any).log = (req as any).log.child({
                userId: user.userId,
                userType: user.userType,
            });
        }

        // Admin routes require admin token
        if (accessLevel === 'admin' && user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};
